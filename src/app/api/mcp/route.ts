import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import * as Sentry from "@sentry/nextjs"
import { z } from "zod"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { bangkokNow } from "@/utils/reservation-rules"

/**
 * Gecko Cabane MCP Server
 *
 * Exposes restaurant data (menu, hours, announcements, availability)
 * as MCP tools for AI assistants.
 *
 * Endpoint: POST /api/mcp
 *
 * The server runs in stateless mode (no session management) which is
 * the recommended approach for serverless / edge environments.
 */

const MAX_COVERS = 40

function buildMcpServer() {
  const server = Sentry.wrapMcpServerWithSentry(
    new McpServer({
      name: "gecko-cabane",
      version: "1.0.0",
    })
  )

  // -------------------------------------------------------------------------
  // Tool: get_menu
  // -------------------------------------------------------------------------
  server.tool(
    "get_menu",
    "Get the complete menu of Gecko Cabane (Franco-Thai restaurant, Krabi, Thailand) " +
      "including all active pages (e.g. Lunch, Dinner), their categories, and the available dishes " +
      "with names, descriptions, prices, vegetarian flag, spicy flag and allergens.",
    {},
    async () => {
      const supabase = await createClient()

      const pagesRes = await supabase
        .from("gecko_menu_pages")
        .select("id, name, slug, description, display_order")
        .eq("is_active", true)
        .order("display_order")

      const catRes = await supabase
        .from("gecko_menu_categories")
        .select("id, menu_page_id, name, description, display_order")
        .order("display_order")

      const itemsRes = await supabase
        .from("gecko_menu_items")
        .select("id, category_id, name, description, price, price_label, is_vegetarian, is_spicy, allergens, display_order")
        .eq("is_available", true)
        .order("display_order")

      if (pagesRes.error) throw new Error(pagesRes.error.message)
      if (catRes.error) throw new Error(catRes.error.message)
      if (itemsRes.error) throw new Error(itemsRes.error.message)

      const pages = pagesRes.data
      const categories = catRes.data
      const items = itemsRes.data

      const menu = (pages ?? []).map((page) => ({
        ...page,
        categories: (categories ?? [])
          .filter((c) => c.menu_page_id === page.id)
          .map((cat) => ({
            ...cat,
            items: (items ?? []).filter((i) => i.category_id === cat.id),
          })),
      }))

      return {
        content: [{ type: "text" as const, text: JSON.stringify(menu, null, 2) }],
      }
    }
  )

  // -------------------------------------------------------------------------
  // Tool: get_opening_hours
  // -------------------------------------------------------------------------
  server.tool(
    "get_opening_hours",
    "Get the regular weekly opening hours and upcoming special hours (closures, holiday schedules) " +
      "for Gecko Cabane restaurant. The restaurant is closed on Tuesdays and kitchen closes at 22:00.",
    {},
    async () => {
      const supabase = await createClient()
      const today = bangkokNow().date

      const [{ data: regular, error: regError }, { data: special, error: spError }] =
        await Promise.all([
          supabase
            .from("gecko_opening_hours")
            .select("day_of_week, day_name, is_open, open_time, close_time")
            .order("day_of_week"),
          supabase
            .from("gecko_special_hours")
            .select("date, title, is_open, open_time, close_time, note")
            .gte("date", today)
            .order("date")
            .limit(30),
        ])

      if (regError) throw new Error(regError.message)
      if (spError) throw new Error(spError.message)

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { regular_hours: regular ?? [], upcoming_special_hours: special ?? [] },
              null,
              2
            ),
          },
        ],
      }
    }
  )

  // -------------------------------------------------------------------------
  // Tool: get_announcements
  // -------------------------------------------------------------------------
  server.tool(
    "get_announcements",
    "Get currently active announcements and news from Gecko Cabane restaurant " +
      "(e.g. special events, seasonal menus, temporary closures).",
    {},
    async () => {
      const supabase = await createClient()
      const today = bangkokNow().date

      const { data, error } = await supabase
        .from("gecko_announcement")
        .select("title, content, bg_color, start_date, end_date")
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)

      return {
        content: [{ type: "text" as const, text: JSON.stringify(data ?? [], null, 2) }],
      }
    }
  )

  // -------------------------------------------------------------------------
  // Tool: check_availability
  // -------------------------------------------------------------------------
  server.tool(
    "check_availability",
    `Check if Gecko Cabane has capacity for a reservation on a given date. ` +
      `The restaurant has a maximum of ${MAX_COVERS} covers per service. ` +
      `Returns whether the party can be accommodated and the remaining capacity.`,
    {
      date: z.string().describe("Date to check in YYYY-MM-DD format"),
      party_size: z
        .number()
        .int()
        .min(1)
        .max(MAX_COVERS)
        .describe("Number of guests in the party"),
    },
    async ({ date, party_size }) => {
      // gecko_reservations has no public SELECT policy (customer PII), so the
      // anon client would always see zero rows and report full availability.
      // Service-role is safe here: only the aggregate column party_size is
      // selected and no personal data is returned to the caller.
      const supabase = createAdminClient()

      const { data: reservations, error } = await supabase
        .from("gecko_reservations")
        .select("party_size")
        .eq("reservation_date", date)
        .in("status", ["pending", "confirmed"])

      if (error) throw new Error(error.message)

      const bookedCovers = (reservations ?? []).reduce(
        (sum: number, r: { party_size: number }) => sum + r.party_size,
        0
      )
      const remaining = MAX_COVERS - bookedCovers
      const available = remaining >= party_size

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                date,
                party_size,
                available,
                remaining_capacity: remaining,
                message: available
                  ? `We can accommodate ${party_size} guest(s) on ${date}. ` +
                    `Remaining capacity: ${remaining} covers.`
                  : `We cannot accommodate ${party_size} guest(s) on ${date}. ` +
                    `Only ${remaining} cover(s) remaining out of ${MAX_COVERS}.`,
              },
              null,
              2
            ),
          },
        ],
      }
    }
  )

  return server
}

// ---------------------------------------------------------------------------
// Next.js Route Handler (stateless — one server instance per request)
// ---------------------------------------------------------------------------

async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode — no session cookies needed
    // Plain JSON responses: with the default SSE stream the `finally` below
    // closes the server before the client has read the stream, so every call
    // returned an empty 200 body.
    enableJsonResponse: true,
  })

  const server = buildMcpServer()

  try {
    await server.connect(transport)
    return await transport.handleRequest(request)
  } finally {
    await server.close()
  }
}

export const GET = (req: Request) => handleMcpRequest(req)
export const POST = (req: Request) => handleMcpRequest(req)
export const DELETE = (req: Request) => handleMcpRequest(req)

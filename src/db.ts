import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type RSVP = Database["public"]["Tables"]["rsvps"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];

const supabaseUrl = "https://dmxnczlntlpsvwgutlml.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteG5jemxudGxwc3Z3Z3V0bG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDMyMjUsImV4cCI6MjAwMjM3OTIyNX0.RBafDsI9C_QuV4ulNJ0ziqyg7cBwinmFr3jDWBPnc_o";
export const supabase = createClient<Database>(supabaseUrl, supabaseKey!);
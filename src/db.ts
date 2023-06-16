import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = "https://dmxnczlntlpsvwgutlml.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteG5jemxudGxwc3Z3Z3V0bG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDMyMjUsImV4cCI6MjAwMjM3OTIyNX0.RBafDsI9C_QuV4ulNJ0ziqyg7cBwinmFr3jDWBPnc_o";
export const supabase = createClient<Database>(supabaseUrl, supabaseKey!);
import { User, PostgrestError } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { Database } from "./database.types";
import { supabase } from "./db";

export function useLoading() {
  return useState<boolean>(true);
}

export function useUser(): [boolean, User | null] {
  const [isLoading, setIsLoading] = useLoading();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return [isLoading, user];
}

/** Fetch a single row from a table with the given ID and listen for updates. */
export function useRow<T extends { id: string | number }>(
  tableName: keyof Database["public"]["Tables"],
  id: string | number | undefined
): [boolean, PostgrestError | null, T | null] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [row, setRow] = useState<T | null>(null);

  useEffect(() => {
    if (!id) {
      setRow(null);
      return;
    }
    setIsLoading(true);
    supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setError(error);
        } else {
          setError(null);
        }

        setIsLoading(false);
    
        setRow(data as unknown as T);
      });

    const channel = supabase
      .channel(`${tableName}-${id}-channel`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: tableName,
          filter: `id=eq.${id}`,
        },
        (payload) => setRow(payload.new as T)
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
          filter: `id=eq.${id}`,
        },
        (payload) => setRow(payload.new as T)
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: tableName,
          filter: `id=eq.${id}`,
        },
        () => setRow(null)
      )
      .subscribe((status) =>
        console.debug(
          `Subbed to table ${tableName} document ${id} with status ${status}`
        )
      );
    return () => {
      channel
        .unsubscribe()
        .then((val) =>
          console.debug(
            `Unsubbed from table ${tableName} document ${id} with status ${val}`
          )
        );
    };
  }, [tableName, id]);

  return [isLoading, error, row];
}

export type RowFilters = {
  initial: [string, string, string][];
  update: string;
} | false;

/** Fetch rows from a table with the given filters, and listen for realtime updates. */
export function useRows<T extends { id: any }>(
  tableName: keyof Database["public"]["Tables"],
  filters?: RowFilters,
  select?: string
): [boolean, PostgrestError | null, T[]] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    if (filters === false) {
      setRows([]);
      return;
    }

    let query = supabase.from(tableName).select(select ?? "*");

    filters?.initial.forEach((filter) => (query = query.filter(...filter)));
    
    query.then(({ data, error }) => {
      if (error) {
        console.error(error);
        setError(error);
      } else {
        setError(null);
      }
      setIsLoading(false);
      setRows((data as unknown as T[]) ?? []);
    });

    const channel = supabase
      .channel(`${tableName}-all-channel`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: tableName,
          filter: filters?.update,
        },
        (payload) => {
          setRows((rows) =>
            rows.map((row) =>
              row.id === payload.old.id ? (payload.new as T) : row
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
          filter: filters?.update,
        },
        async (payload) => {
          if (select) {
            const { data, error } = await supabase.from(tableName).select(select).eq("id", payload.new.id).limit(1).single();
            if (!error && data) {
              setRows((rows) => [...rows, data as unknown as T]);
            }
          } else {
            setRows((rows) => [...rows, payload.new as T])
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: tableName,
          filter: filters?.update,
        },
        (payload) =>
          setRows((rows) => rows.filter((row) => row.id !== payload.old.id))
      )
      .subscribe((status) =>
        console.debug(`Subbed to table ${tableName} with status ${status}`)
      );
    return () => {
      channel
        .unsubscribe()
        .then((val) =>
          console.debug(`Unsubbed from table ${tableName} with status ${val}`)
        );
    };
  }, [tableName, filters]);

  return [isLoading, error, rows];
}

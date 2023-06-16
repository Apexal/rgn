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

export function useDocument<T extends { id: string | number }>(
  tableName: keyof Database["public"]["Tables"],
  id: string | number | undefined
): [boolean, PostgrestError | null, T | null] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [row, setRow] = useState<T | null>(null);

  useEffect(() => {
    supabase
      .from(tableName)
      .select("*")
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
        console.log(
          `Subbed to table ${tableName} document ${id} with status ${status}`
        )
      );
    return () => {
      channel
        .unsubscribe()
        .then((val) =>
          console.log(
            `Unsubbed from table ${tableName} document ${id} with status ${val}`
          )
        );
    };
  }, [tableName, id]);

  return [isLoading, error, row];
}

export function useTable<T extends { id: any }>(
  tableName: keyof Database["public"]["Tables"],
  initialFilters: [string, string, string][] | undefined = undefined,
  updateFilter: string | undefined = undefined
): [boolean, PostgrestError | null, T[]] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    let query = supabase.from(tableName).select("*");

    initialFilters?.forEach((filter) => (query = query.filter(...filter)));
    
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
          filter: updateFilter,
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
          filter: updateFilter,
        },
        (payload) => setRows((rows) => [...rows, payload.new as T])
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: tableName,
          filter: updateFilter,
        },
        (payload) =>
          setRows((rows) => rows.filter((row) => row.id !== payload.old.id))
      )
      .subscribe((status) =>
        console.log(`Subbed to table ${tableName} with status ${status}`)
      );
    return () => {
      channel
        .unsubscribe()
        .then((val) =>
          console.log(`Unsubbed from table ${tableName} with status ${val}`)
        );
    };
  }, [tableName, initialFilters, updateFilter]);

  return [isLoading, error, rows];
}

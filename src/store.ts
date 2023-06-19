import { User, PostgrestError } from "@supabase/supabase-js";
import { createContext } from "react";
import { Activity, Player, RSVP, Vote, Event } from "./db";

export type AppContext = {
    user: User | null;
    isUserLoading: boolean;
    player: Player | null;
    isPlayerLoading: boolean;
    playerError: PostgrestError | null;
  
    isEventsLoading: boolean;
    eventsError: PostgrestError | null;
    events: Event[];
    activeEvent: Event | null;
  
    isActivitiesLoading: boolean;
    activitiesError: PostgrestError | null;
    activities: Activity[];
  
    isVotesLoading: boolean;
    votesError: PostgrestError | null;
    votes: (Vote & { players: Pick<Player, "name">})[];
  
    isRsvpsLoading: boolean;
    rsvpsError: PostgrestError | null;
    rsvps: (RSVP & { players: Pick<Player, "name">})[];
  };
  export const AppContext = createContext<AppContext>({
    player: null,
    isPlayerLoading: true,
    playerError: null,
    activities: [],
    isActivitiesLoading: true,
    activitiesError: null,
    events: [],
    activeEvent: null,
    isEventsLoading: true,
    eventsError: null,
    user: null,
    isUserLoading: true,
    isVotesLoading: true,
    votesError: null,
    votes: [],
    isRsvpsLoading: true,
    rsvpsError: null,
    rsvps: [],
  });
  
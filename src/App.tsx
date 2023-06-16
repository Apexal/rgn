import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  AvatarBadge,
  AvatarGroup,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  Center,
  Container,
  Divider,
  Flex,
  HStack,
  Heading,
  Image,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  SimpleGrid,
  Skeleton,
  Spacer,
  Spinner,
  Stack,
  Tag,
  Text,
  Wrap,
  WrapItem,
  useColorMode,
  useToken,
} from "@chakra-ui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { PostgrestError, User, createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import formatRelative from "date-fns/formatRelative";

import "./app.css";
import { useUser, useTable, useDocument } from "./hooks";

const supabaseUrl = "https://dmxnczlntlpsvwgutlml.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteG5jemxudGxwc3Z3Z3V0bG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDMyMjUsImV4cCI6MjAwMjM3OTIyNX0.RBafDsI9C_QuV4ulNJ0ziqyg7cBwinmFr3jDWBPnc_o";
export const supabase = createClient<Database>(supabaseUrl, supabaseKey!);

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Event = Database["public"]["Tables"]["events"]["Row"];
type RSVP = Database["public"]["Tables"]["rsvps"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  indexAxis: "y" as const,
  elements: {
    bar: {
      borderWidth: 2,
    },
  },
  responsive: true,
  plugins: {
    legend: {
      position: "right" as const,
    },
  },
};

function formatMoney(cents: number) {
  return `$${cents / 100}`;
}

type AppContext = {
  user: User | null;
  player: Player | null;
  isUserLoading: boolean;

  isEventsLoading: boolean;
  eventsError: PostgrestError | null;
  events: Event[];
  activeEvent: Event | null;

  isActivitiesLoading: boolean;
  activitiesError: PostgrestError | null;
  activities: Activity[];
};
const AppContext = createContext<AppContext>({
  player: null,
  activities: [],
  isActivitiesLoading: true,
  activitiesError: null,
  events: [],
  activeEvent: null,
  isEventsLoading: true,
  eventsError: null,
  user: null,
  isUserLoading: true,
});

/** Bar displaying logged in user with options to sign in/sign out or edit profile. */
function UserProfile() {
  const [isUserLoading, user] = useUser();

  const discordIdentityData = user?.identities?.at(0)?.identity_data;

  async function signInWithDiscord() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
    });
    if (error) {
      alert(
        "There was an error signing in with Discord... Please try again later."
      );
    }
  }

  if (user) {
    return (
      <nav>
        <Center>
          <HStack spacing={3}>
            <Skeleton isLoaded={!isUserLoading}>
              <Avatar
                bgColor={"gray"}
                size={"sm"}
                name={discordIdentityData?.full_name}
                src={discordIdentityData?.avatar_url}
              />
            </Skeleton>
            <Skeleton isLoaded={!isUserLoading}>
              <Text fontSize={"3xl"}>
                Hi, {discordIdentityData?.full_name ?? "User"}
              </Text>
            </Skeleton>
            <Skeleton isLoaded={!isUserLoading}>
              <Flex direction={"row"} gap={2} justifyItems={"center"}>
                <Button size={"sm"}>Edit profile</Button>
                <Button size={"sm"} onClick={() => supabase.auth.signOut()}>
                  Log out
                </Button>
              </Flex>
            </Skeleton>
          </HStack>
        </Center>
      </nav>
    );
  } else {
    return (
      <Button onClick={() => signInWithDiscord()}>Login with Discord</Button>
    );
  }
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardBody>
        <Stack spacing={3}>
          <Skeleton height="150px" />
          <Skeleton height={"20px"} />
          <Skeleton height={"20px"} />
          <Skeleton height={"20px"} />
        </Stack>
      </CardBody>
    </Card>
  );
}

/** Displays the details of an activity along with actions to vote and favorite. */
function ActivityCard({ activity }: { activity: Activity }) {
  const { player, activeEvent } = useContext(AppContext);

  const canVote = !!player && !!activeEvent;

  const intervalID = useRef<number | null>(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  const startThumbnailLoop = () => {
    intervalID.current = setInterval(
      () => setThumbnailIndex((i) => (i + 1) % activity.thumbnail_urls.length),
      3000
    ) as unknown as number;
  };
  const stopThumbnailLoop = () => {
    clearInterval(intervalID.current!);
    intervalID.current = null;
  };

  useEffect(() => {
    if (thumbnailIndex >= activity.thumbnail_urls.length) {
      setThumbnailIndex(0);
    }
    return stopThumbnailLoop;
  }, [activity.thumbnail_urls]);

  return (
    <Card
      onMouseEnter={() => startThumbnailLoop()}
      onMouseLeave={() => stopThumbnailLoop()}
      className="activity-card"
    >
      <CardBody>
        <Image
          borderRadius={"lg"}
          height="150px"
          objectFit="cover"
          width={"100%"}
          alt={activity.name}
          src={activity.thumbnail_urls[thumbnailIndex]}
        />
        <Stack mt={6} spacing={3}>
          <Heading size="lg">{activity.name}</Heading>
          <Text>{activity.summary}</Text>
          {activity.price ? (
            <Text color="blue.600" fontSize="xl">
              <strong>{formatMoney(activity.price)}</strong>{" "}
              {activity.price_type === "subscription" && "subscription"}
            </Text>
          ) : (
            <Text color="blue.600" fontSize="xl">
              <strong>Free!</strong>
            </Text>
          )}
          <Wrap>
            {activity.tags.map((tag) => (
              <WrapItem key={tag}>
                <Tag>{tag}</Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Stack>
      </CardBody>
      {(canVote || player) && (
        <>
          <Divider />
          <CardFooter>
            <ButtonGroup spacing={2}>
              {canVote && (
                <Button variant={"solid"} colorScheme={"blue"}>
                  Vote to Play
                </Button>
              )}
              {player && (
                <Button
                  variant={canVote ? "ghost" : "solid"}
                  colorScheme="blue"
                >
                  Favorite
                </Button>
              )}
            </ButtonGroup>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

function randomName() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let name = "";
  for (let i = 0; i < Math.random() * 10; i++) {
    name += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return name;
}

/** Overview of active event displaying RSVPs, votes, and actions to RSVP. */
function ActiveEventView() {
  const { activeEvent, activities } = useContext(AppContext);
  const [isRsvpsLoading, rsvpsError, rsvps] = useTable<RSVP>(
    "rsvps",
    [["event_id", "eq", activeEvent!.id.toString()]],
    `event_id=eq.${activeEvent!.id}`
  );
  const [teal500, teal600] = useToken("colors", ["teal.500", "teal.600"]);

  if (!activeEvent) {
    console.warn("No active event yet ActiveEventView is being rendered");
    return null;
  }

  const data = {
    labels: activities.map((act) => act.name),
    datasets: [
      {
        label: "Votes",
        data: activities.map((act) => Math.random() * 10),
        borderColor: teal500,
        backgroundColor: teal600,
      },
    ],
  };

  return (
    <Box p={"6"} borderWidth={"1px"} borderRadius={"lg"} my={"10"}>
      <Flex gap={"3"}>
        <Stack flex={"1"}>
          <Heading as="h3">Votes</Heading>
          <Bar options={options} data={data} />
        </Stack>
        <Stack spacing={"3"} flex={"1"}>
          <Heading as="h3">Who's Coming?</Heading>
          <Wrap spacing={"3"}>
            {rsvps?.map((rsvp) => (
              <WrapItem key={rsvp.id}>
                <Avatar name={"Frank"}>
                  <AvatarBadge bg="green.500" boxSize={"1.25em"} />
                </Avatar>
              </WrapItem>
            ))}
            {[...Array(15)].map((_, i) => (
              <WrapItem key={i}>
                <Avatar name={randomName()}>
                  <AvatarBadge bg="green.500" boxSize={"1.25em"} />
                </Avatar>
              </WrapItem>
            ))}
          </Wrap>
        </Stack>
      </Flex>
    </Box>
  );
}

function NoPlayerView() {
  return (
    <Alert
      status="warning"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="200px"
      my={10}
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={3} fontSize="3xl">
        Pending Verification
      </AlertTitle>
      <AlertDescription maxWidth="sm" fontSize={"lg"}>
        <Text>
          Once you are verified, you'll be able to see who is attending and be
          able to vote on activities.
        </Text>
      </AlertDescription>
    </Alert>
  );
}

function NoActiveEventView() {
  const { events } = useContext(AppContext);

  const nextEvent = useMemo(
    () =>
      events
        .sort((a, b) => (a.start_at < b.start_at ? 1 : -1))
        .find((ev) => new Date(ev.start_at) > new Date()),
    [events]
  );

  return (
    <Alert
      status="info"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="200px"
      my={10}
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        No game night tonight!
      </AlertTitle>
      <AlertDescription maxWidth="sm">
        {nextEvent ? (
          <Text>
            The next one is scheduled for{" "}
            <strong>
              {formatRelative(new Date(nextEvent.start_at), new Date())}
            </strong>
          </Text>
        ) : (
          <Text>The next one is not yet scheduled.</Text>
        )}
      </AlertDescription>
    </Alert>
  );
}

function ActivityView() {
  const {
    player,
    activeEvent,
    activitiesError,
    activities,
    isActivitiesLoading,
  } = useContext(AppContext);

  const canVote = !!player && !!activeEvent;

  return (
    <>
      <Heading>
        {canVote ? "What do you want to play tonight?" : "Our Activities"}
      </Heading>
      {activitiesError && (
        <Alert status="error" my={"5"}>
          <AlertIcon /> There was an error fetching the activities. Blame Frank
          and try again later!
        </Alert>
      )}
      <SimpleGrid columns={3} spacing={10} my={10}>
        {isActivitiesLoading && !activities
          ? [1, 2, 3].map((_, index) => <ActivitySkeleton key={index} />)
          : activities!.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
      </SimpleGrid>

      <Popover placement="left-start">
        <PopoverTrigger>
          <Button>Missing something?</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverBody>
            Drop a message in{" "}
            <Link
              color="teal.500"
              href="https://discord.com/channels/572259473834377255/1118403797681713265"
              isExternal
            >
              #🕹-game-night
            </Link>{" "}
            with your game/activity suggestion and I'll get it added
            immediately!
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
}

function App() {
  const { colorMode, toggleColorMode } = useColorMode();

  const [isActivitiesLoading, activitiesError, activities] =
    useTable<Activity>("activities");
  const [isEventsLoading, eventsError, events] = useTable<Event>("events");
  const [isUserLoading, user] = useUser();
  const [isPlayerLoading, playerError, player] = useDocument<Player>(
    "players",
    user?.id
  );

  const activeEvent = useMemo<Event | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      events.find((event) => {
        const eventDay = new Date(event.start_at);
        eventDay.setHours(0, 0, 0, 0);
        return eventDay.getTime() === today.getTime();
      }) ?? null
    );
  }, [events]);

  const appData = useMemo<AppContext>(
    () => ({
      player,
      isActivitiesLoading,
      activitiesError,
      activities,
      activeEvent,
      isUserLoading,
      user,
      isEventsLoading,
      events,
      eventsError,
    }),
    [
      player,
      isActivitiesLoading,
      activitiesError,
      activities,
      activeEvent,
      isUserLoading,
      user,
      isEventsLoading,
      events,
      eventsError,
    ]
  );

  return (
    <AppContext.Provider value={appData}>
      <Container maxW="container.lg" my={10}>
        <Flex minWidth={"max-content"} alignItems={"center"} gap={2} mb={10}>
          <UserProfile />
          <Spacer />
          <Button size={"sm"} onClick={toggleColorMode}>
            Toggle {colorMode === "light" ? "Dark" : "Light"}
          </Button>
        </Flex>

        {!isUserLoading && user ? (
          <main>
            <Heading as="h1" size="4xl">
              Rathskeller Game Night
            </Heading>

            {player ? (
              activeEvent ? (
                <ActiveEventView />
              ) : (
                <NoActiveEventView />
              )
            ) : (
              <NoPlayerView />
            )}

            <ActivityView />
          </main>
        ) : (
          <Heading as={"p"} fontSize={"3xl"}>
            Login with Discord to get started.
          </Heading>
        )}
      </Container>
    </AppContext.Provider>
  );
}

export default App;

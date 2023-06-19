import type { AlertDialogProps } from "@chakra-ui/react";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
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
  Checkbox,
  CheckboxGroup,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  SimpleGrid,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
  useColorMode,
  useDisclosure,
  useToast,
  useToken,
} from "@chakra-ui/react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  Title,
} from "chart.js";
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bar } from "react-chartjs-2";

import formatRelative from "date-fns/formatRelative";

import { SubmitHandler, useForm } from "react-hook-form";
import { Activity, Player, Event, supabase } from "./db";
import { RowFilters, useRow, useRows, useUser } from "./hooks";
import { AppContext } from "./store";

import "./app.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
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

type PlayerProfileInputs = {
  name: string;
  windows: boolean;
  mac: boolean;
  mobile: boolean;
};
/** Bar displaying logged in user with options to sign in/sign out or edit profile. */
function UserProfile() {
  const { register, handleSubmit } = useForm<PlayerProfileInputs>();
  const toast = useToast();
  const [isUserLoading, user] = useUser();
  const { player, isPlayerLoading } = useContext(AppContext);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const discordIdentityData = user?.identities?.at(0)?.identity_data;

  async function signInWithDiscord() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: "http://localhost:5173/", // TODO: env
      },
    });
    if (error) {
      alert(
        "There was an error signing in with Discord... Please try again later."
      );
    }
  }

  const onSubmitProfileForm: SubmitHandler<PlayerProfileInputs> = async (
    data
  ) => {
    if (!player) {
      return;
    }

    const { error } = await supabase
      .from("players")
      .update({
        name: data.name,
        platforms: (["windows", "mac", "mobile"] as const).filter(
          (platform) => data[platform]
        ),
      })
      .eq("id", player.id);

    if (error) {
      console.error(error);
      toast({
        description:
          "There was an error updating your profile. Yell at Frank to fix this!",
        status: "error",
      });
      return;
    } else {
      toast({
        description: "Your player profile has been updated.",
        status: "success",
      });
      onClose();
    }
  };

  if (user) {
    return (
      <>
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
              <Skeleton
                isLoaded={!isUserLoading && !isPlayerLoading}
                display={"flex"}
                alignItems={"center"}
                gap={3}
              >
                <Text fontSize={"3xl"}>
                  Hi, {player?.name ?? discordIdentityData?.full_name ?? "User"}
                </Text>
                <Flex direction={"row"} gap={2} justifyItems={"center"}>
                  <Tooltip label="Edit player profile">
                    <Button size={"sm"} onClick={() => onOpen()}>
                      ✏
                    </Button>
                  </Tooltip>
                  <Tooltip label="Log out">
                    <Button size={"sm"} onClick={() => supabase.auth.signOut()}>
                      🚪
                    </Button>
                  </Tooltip>
                </Flex>
              </Skeleton>
            </HStack>
          </Center>
        </nav>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit your player profile</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <form
                id="profile-form"
                onSubmit={handleSubmit(onSubmitProfileForm)}
              >
                <FormControl mb={"5"}>
                  <FormLabel>Name</FormLabel>
                  <Input
                    {...register("name", {
                      required: true,
                      maxLength: 30,
                      min: 2,
                    })}
                    defaultValue={player?.name ?? ""}
                  />
                </FormControl>

                <FormLabel>What devices can you play on?</FormLabel>
                <CheckboxGroup defaultValue={player?.platforms ?? []}>
                  <Stack spacing={[1, 5]} direction={["column", "row"]}>
                    <Checkbox {...register("windows")} value="windows">
                      Windows
                    </Checkbox>
                    <Checkbox {...register("mac")} value="mac">
                      Mac
                    </Checkbox>
                    <Checkbox {...register("mobile")} value="mobile">
                      Mobile
                    </Checkbox>
                  </Stack>
                </CheckboxGroup>
              </form>
            </ModalBody>

            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                form="profile-form"
                type="submit"
              >
                Save
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
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
  const toast = useToast();
  const { player, activeEvent, votes, rsvps } = useContext(AppContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef =
    useRef<AlertDialogProps["leastDestructiveRef"]["current"]>(null);
  const canVote = !!player && !!activeEvent;

  const intervalID = useRef<number | null>(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  const activityVotes = votes.filter(
    (vote) =>
      vote.event_id === activeEvent?.id && vote.activity_id === activity.id
  );

  const isVotedForByPlayer = votes.find(
    (vote) => vote.player_id === player?.id && vote.activity_id === activity.id
  );

  const isUserRsvped = rsvps.find(
    (rsvp) => rsvp.player_id === player?.id && rsvp.event_id === activeEvent?.id
  );

  const startThumbnailLoop = () => {
    intervalID.current = setInterval(
      () => setThumbnailIndex((i) => (i + 1) % activity.thumbnail_urls.length),
      1500
    ) as unknown as number;
  };
  const stopThumbnailLoop = () => {
    clearInterval(intervalID.current!);
    intervalID.current = null;
  };

  const rsvp = async () => {
    if (!activeEvent || !player) {
      return;
    }

    const { error } = await supabase.from("rsvps").insert({
      event_id: activeEvent.id,
      player_id: player.id,
    });

    if (error) {
      console.warn(error);
      toast({
        description:
          "There was an error RSVPing you. Yell at Frank to fix this!",
        status: "error",
      });
    } else {
      toast({
        description:
          "You RSVPed for this game night. You better show up on time.",
        status: "success",
      });
    }
  };

  const toggleVote = async (requireRSVP: boolean = true) => {
    if (!activeEvent || !player) {
      return;
    }

    if (isVotedForByPlayer) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("event_id", activeEvent.id)
        .eq("activity_id", activity.id)
        .eq("player_id", player.id);

      if (error) {
        toast({
          description:
            "There was an error removing your vote. Yell at Frank to fix this!",
          status: "error",
        });
      } else {
        toast({
          description: "Removed your vote!",
          status: "info",
        });
      }
    } else {
      if (requireRSVP && !isUserRsvped) {
        return onOpen();
      }
      const { error } = await supabase.from("votes").insert({
        event_id: activeEvent.id,
        player_id: player.id,
        activity_id: activity.id,
      });

      if (error) {
        toast({
          description:
            "There was an error submitting your vote. Yell at Frank to fix this!",
          status: "error",
        });
      } else {
        toast({
          description: "Submitted your vote!",
          status: "success",
        });
      }
    }
  };

  useEffect(() => {
    if (thumbnailIndex >= activity.thumbnail_urls.length) {
      setThumbnailIndex(0);
    }
    return stopThumbnailLoop;
  }, [activity.thumbnail_urls]);

  return (
    <>
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
                {canVote &&
                  (isVotedForByPlayer ? (
                    <Button
                      variant={"outline"}
                      colorScheme={"blue"}
                      onClick={() => toggleVote()}
                    >
                      Un-Vote
                    </Button>
                  ) : (
                    <Button
                      variant={"solid"}
                      colorScheme={"blue"}
                      onClick={() => toggleVote()}
                    >
                      {isUserRsvped ? "Vote to Play" : "RSVP & Vote"}
                    </Button>
                  ))}
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
        <AvatarGroup
          position={"absolute"}
          size={"sm"}
          bottom={"-4%"}
          translateY={"-50%"}
          max={10}
        >
          {activityVotes.map((vote) => (
            <Tooltip key={vote.id} label={vote.players.name ?? "Unnamed Player"}>
              <Avatar size={"sm"}
              className="slideIn"
              
              name={vote.players.name ?? "?"}
            />
            </Tooltip>
          ))}
        </AvatarGroup>
      </Card>

      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>RSVP?</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            By casting a vote, you are RSVPing to game night tonight.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="green"
              ml={"3"}
              onClick={() => rsvp().then(() => toggleVote(false).then(onClose))}
            >
              RSVP & Vote
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Overview of active event displaying RSVPs, votes, and actions to RSVP. */
function ActiveEventView() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef =
    useRef<AlertDialogProps["leastDestructiveRef"]["current"]>(null);
  const { player, user, activeEvent, activities, votes, rsvps, isRsvpsLoading } =
    useContext(AppContext);

  const [teal500, teal600] = useToken("colors", ["teal.500", "teal.600"]);

  if (!user || !activeEvent || !player) {
    return null;
  }

  const isUserRsvped = rsvps.find(
    (rsvp) => rsvp.player_id === user.id && rsvp.event_id === activeEvent.id
  );

  const data = {
    labels: activities.map((act) => act.name),
    datasets: [
      {
        label: "Votes",
        data: activities.map(
          (act) => votes.filter((vote) => vote.activity_id === act.id).length
        ),
        borderColor: teal500,
        backgroundColor: teal600,
      },
    ],
  };

  const toggleRSVP = async () => {
    if (isUserRsvped) {
      // Ensure no votes
      if (votes.find((vote) => vote.player_id === player.id)) {
        return onOpen();
      }

      const { error } = await supabase
        .from("rsvps")
        .delete()
        .eq("player_id", player.id)
        .eq("event_id", activeEvent.id);

      if (error) {
        console.warn(error);
        toast({
          description:
            "There was an error removing your RSVP you for tonight. Yell at Frank to fix this!",
          status: "error",
        });
      } else {
        toast({
          description:
            "You've removed your RSVP for game night tonight. This is so sad.",
          status: "info",
        });
      }
    } else {
      const { error } = await supabase.from("rsvps").insert({
        event_id: activeEvent.id,
        player_id: player.id,
      });

      if (error) {
        console.warn(error);
        toast({
          description:
            "There was an error RSVPing you for tonight. Yell at Frank to fix this!",
          status: "error",
        });
      } else {
        toast({
          description:
            "You've RSVPed for game night tonight! You better show up.",
          status: "success",
        });
      }
    }
  };

  return (
    <>
      <Box p={"6"} borderWidth={"1px"} borderRadius={"lg"} my={"10"}>
        <Flex gap={"3"} direction={{ base: "column", md: "row" }}>
          <Stack flex={"1"}>
            <Heading as="h3">Votes</Heading>
            <Bar options={options} data={data} />
          </Stack>
          <Stack spacing={"5"} flex={"1"}>
            <Heading as="h3">Who's Coming?</Heading>
            <Skeleton isLoaded={!isRsvpsLoading} width={"100%"} display={"flex"}>
              <Wrap spacing={"3"}>
                {rsvps?.map((rsvp) => (
                  <WrapItem key={rsvp.player_id} className="slideIn from-right">
                    <Tooltip label={rsvp.players.name ?? "Unnamed Player"}>
                    <Avatar name={rsvp.players.name ?? "?"}>
                      <AvatarBadge bg="green.500" boxSize={"1.25em"} />
                    </Avatar>
                    </Tooltip>
                  </WrapItem>
                ))}
              </Wrap>
            </Skeleton>

              {isUserRsvped ? (
                <Button
                  colorScheme={"green"}
                  variant={"outline"}
                  onClick={() => toggleRSVP()}
                >
                  I'm NOT Coming
                </Button>
              ) : (
                <Button colorScheme={"green"} onClick={() => toggleRSVP()}>
                  I'm Coming
                </Button>
              )}
          </Stack>
        </Flex>
      </Box>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Getting Cold Feet?
            </AlertDialogHeader>

            <AlertDialogBody>
              You've already voted on activities for tonight. Remove those votes
              first if you want to take back your RSVP.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button colorScheme="red" onClick={onClose}>
                Ok
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

/** Alert with warning explaining that the user must be manually verified to continue. */
function NoPlayerView() {
  return (
    <Alert
      status="warning"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      py={10}
      my={10}
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={3} fontSize="3xl">
        Pending Verification
      </AlertTitle>
      <AlertDescription maxWidth="sm" fontSize={"md"}>
        <Text>
          Frank will now manually verify your account. Once verified, you can
          RSVP for game nights and vote on the activities below.
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
      <SimpleGrid columns={[1, 2, 3]} spacing={10} my={10}>
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

  // Fetch activities and events and listen for updates
  const [isActivitiesLoading, activitiesError, activities] =
    useRows<Activity>("activities");
  const [isEventsLoading, eventsError, events] = useRows<Event>("events");

  // Find today's event (or null)
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

  // Memo-ize filters to not cause wasteful re-renders
  const voteFilters = useMemo<RowFilters>(
    () => {
      if (activeEvent) {
        return {
          initial: [["event_id", "eq", activeEvent?.id.toString()]],
          update: `event_id=eq.${activeEvent?.id}`,
        };
      } else {
        return false;
      }
    },
    [activeEvent]
  );

  // Fetch votes for the active event
  const [isVotesLoading, votesError, votes] = useRows<AppContext["votes"][number]>(
    "votes",
    voteFilters,
    "*,players(name)"
  );
  // Fetch logged in user and their player profile (or null)
  const [isUserLoading, user] = useUser();
  const [isPlayerLoading, playerError, player] = useRow<Player>(
    "players",
    user?.id
  );

  // Memo-ize filters to not cause wasteful re-renders
  const rsvpFilters = useMemo<RowFilters>(
    () => {
      if (activeEvent) {
        return {initial: [["event_id", "eq", activeEvent?.id.toString()]],
        update: `event_id=eq.${activeEvent?.id}`,}
      } else {
        return false;
      }
    },
    [activeEvent]
  );
  // Fetch active event RSVPs
  const [isRsvpsLoading, rsvpsError, rsvps] = useRows<AppContext["rsvps"][number]>(
    "rsvps",
    rsvpFilters,
    "*,players(name)"
  );

  // Memo-ize context value to not cause infinite re-renders
  const appData = useMemo<AppContext>(
    () => ({
      player,
      isPlayerLoading,
      playerError,
      isActivitiesLoading,
      activitiesError,
      activities,
      activeEvent,
      isUserLoading,
      user,
      isEventsLoading,
      events,
      eventsError,
      isVotesLoading,
      votesError,
      votes,
      isRsvpsLoading,
      rsvpsError,
      rsvps,
    }),
    [
      player,
      isPlayerLoading,
      playerError,
      isActivitiesLoading,
      activitiesError,
      activities,
      activeEvent,
      isUserLoading,
      user,
      isEventsLoading,
      events,
      eventsError,
      isVotesLoading,
      votesError,
      votes,
      isRsvpsLoading,
      rsvpsError,
      rsvps,
    ]
  );

  return (
    <AppContext.Provider value={appData}>
      <Container maxW="container.lg" my={10}>
        <Flex minWidth={"max-content"} alignItems={"center"} gap={2} mb={10}>
          <UserProfile />
          <Spacer />
          <Tooltip
            label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
          >
            <Button size={"sm"} onClick={toggleColorMode}>
              {colorMode === "light" ? "🌚" : "🌞"}
            </Button>
          </Tooltip>
        </Flex>

        {!isUserLoading && user ? (
          <main>
            <Heading as="h1" size={["3xl", null, "4xl"]}>
              Rathskeller Game Night
            </Heading>

            <Skeleton isLoaded={!isPlayerLoading && !isEventsLoading}>
              {player ? (
                activeEvent ? (
                  <ActiveEventView />
                ) : (
                  <NoActiveEventView />
                )
              ) : (
                <NoPlayerView />
              )}
            </Skeleton>

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

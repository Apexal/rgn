import type { AlertDialogProps, UseModalProps } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
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
  Spinner,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Tag,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
  useColorMode,
  useDisclosure,
  useSteps,
  useToast,
  useToken,
} from "@chakra-ui/react";
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  LinearScale,
  Title,
} from "chart.js";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Bar, getElementAtEvent } from "react-chartjs-2";

import formatRelative from "date-fns/formatRelative";

import { SubmitHandler, useForm } from "react-hook-form";
import {
  Activity,
  Player,
  Event,
  supabase,
  PlayerActivityMetadata,
} from "./db";
import { RowFilters, useNow, useRow, useRows, useUser } from "./hooks";
import { AppContext } from "./store";

import "./app.css";

import windowsIcon from "./assets/windows.png";
import macOSIcon from "./assets/macos.png";
import cellPhoneIcon from "./assets/mobile.png";
import {
  CheckIcon,
  EditIcon,
  InfoOutlineIcon,
  MoonIcon,
  StarIcon,
  SunIcon,
  TriangleUpIcon,
} from "@chakra-ui/icons";
import subDays from "date-fns/subDays";
import { Interval, endOfDay, isWithinInterval } from "date-fns";
import formatDistance from "date-fns/formatDistance";
import format from "date-fns/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip);

const options = {
  indexAxis: "x" as const,
  elements: {
    bar: {
      borderWidth: 2,
    },
  },
  responsive: true,
  scales: {
    y: {
      ticks: {
        precision: 0,
      },
    },
  },
};

function formatMoney(cents: number) {
  return `$${cents / 100}`;
}

const signInWithDiscord = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: import.meta.env.DEV ? "http://localhost:5173/" : undefined,
    },
  });
  if (error) {
    alert(
      "There was an error signing in with Discord... Please try again later."
    );
  }
};

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

  const onSubmitProfileForm: SubmitHandler<PlayerProfileInputs> = async (
    data
  ) => {
    if (!player) {
      return onClose();
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
                  {player && (
                    <Tooltip label="Edit player profile">
                      <Button size={"sm"} onClick={() => onOpen()}>
                        <EditIcon />
                      </Button>
                    </Tooltip>
                  )}
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
function ActivityCard({
  activity,
  playerMetadata,
}: {
  activity: Activity;
  playerMetadata?: PlayerActivityMetadata;
}) {
  const toast = useToast();
  const { player, activeEvent, votes, rsvps } = useContext(AppContext);
  const {
    isOpen: isRsvpDialogOpen,
    onOpen: onRsvpDialogOpen,
    onClose: onRsvpDialogClose,
  } = useDisclosure();
  const {
    isOpen: isInfoModalOpen,
    onOpen: onInfoModalOpen,
    onClose: onInfoModalClose,
  } = useDisclosure();
  const rsvpDialogCancelRef =
    useRef<AlertDialogProps["leastDestructiveRef"]["current"]>(null);
  const canVote = player?.is_verified && !!activeEvent;

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
    }
  };

  const markSetup = async () => {
    if (!player) {
      return;
    }

    const { error } = await supabase.from("player_activity_metadata").upsert(
      {
        player_id: player.id,
        activity_id: activity.id,
        is_setup: true,
      },
      {
        onConflict: "player_id,activity_id",
      }
    );
    toast.closeAll();

    if (error) {
      console.error(error);
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
      }
    } else {
      if (requireRSVP && !isUserRsvped) {
        return onRsvpDialogOpen();
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
        if (!playerMetadata?.is_setup) {
          const actions = [];
          if (activity.price) {
            actions.push("purchase");
          }
          if (activity.storage_required) {
            actions.push("install");
          }
          actions.push("setup");

          toast({
            status: "warning",
            title: `Setup ${activity.name} In Advance`,
            duration: 3000,
            description: (
              <Box>
                <Text>
                  Make you to {actions.join("/")} {activity.name} now to be
                  ready to play later.
                </Text>
                <HStack spacing={"8"} justifyContent={"space-between"}>
                  <Button onClick={onInfoModalOpen} variant={"unstyled"}>
                    Open Setup Guide
                  </Button>
                  <Button onClick={markSetup} variant={"unstyled"}>
                    Already Done!
                  </Button>
                </HStack>
              </Box>
            ),
          });
        }
      }
    }
  };

  const toggleFavorite = async () => {
    if (!player) {
      return null;
    }

    const { error } = await supabase.from("player_activity_metadata").upsert(
      {
        player_id: player.id,
        activity_id: activity.id,
        is_favorite: !playerMetadata?.is_favorite,
      },
      {
        onConflict: "player_id,activity_id",
      }
    );

    if (error) {
      toast({
        description: "There was an error... Yell at Frank to fix this!",
        status: "error",
      });
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
        id={"activity-" + activity.id}
      >
        <StarIcon
          className={
            "favorite-icon " + (playerMetadata?.is_favorite ? "favorited" : "")
          }
          position={"absolute"}
          right={"-2"}
          top={"-3"}
          opacity={playerMetadata?.is_favorite ? 1 : 0.2}
          color={"yellow.400"}
          boxSize={"8"}
          cursor={"pointer"}
          onClick={toggleFavorite}
        />
        <CardBody display={"flex"} flexDirection={"column"}>
          <Image
            borderRadius={"lg"}
            height="150px"
            objectFit="cover"
            width={"100%"}
            alt={activity.name}
            src={activity.thumbnail_urls[thumbnailIndex]}
          />
          <Flex mt={6} gap={3} direction={"column"} flex="1">
            <Heading size="lg">{activity.name}</Heading>
            <Text>{activity.summary}</Text>
            <Wrap>
              {activity.tags.map((tag) => (
                <WrapItem key={tag}>
                  <Tag>{tag}</Tag>
                </WrapItem>
              ))}
            </Wrap>
            <Spacer />
            <Flex gap={2} alignItems={"center"}>
              {playerMetadata?.is_setup ? (
                <Text color="blue.600" fontSize="xl" fontWeight={"bold"}>
                  Owned
                </Text>
              ) : activity.price ? (
                <Text color="blue.600" fontSize="xl">
                  <strong>{formatMoney(activity.price)}</strong>{" "}
                  {activity.price_type === "subscription" && "subscription"}
                </Text>
              ) : (
                <Text color="blue.600" fontSize="xl">
                  <strong>Free!</strong>
                </Text>
              )}
              <Spacer />
              {activity.platforms.includes("windows") && (
                <Image
                  src={windowsIcon}
                  boxSize={"20px"}
                  objectFit={"contain"}
                />
              )}
              {activity.platforms.includes("mac") && (
                <Image src={macOSIcon} boxSize={"20px"} objectFit={"contain"} />
              )}
              {activity.platforms.includes("mobile") && (
                <Image
                  src={cellPhoneIcon}
                  boxSize={"20px"}
                  objectFit={"contain"}
                />
              )}
            </Flex>
          </Flex>
        </CardBody>
        {(canVote || player) && (
          <>
            <Divider />
            <CardFooter>
              <ButtonGroup
                spacing={2}
                justifyContent={"space-between"}
                flex={"1"}
              >
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
                      leftIcon={<TriangleUpIcon />}
                    >
                      {isUserRsvped ? "Vote to Play" : "RSVP & Vote"}
                    </Button>
                  ))}
                {player && (
                  <Tooltip label="Setup guide">
                    <Button
                      variant="ghost"
                      colorScheme="blue"
                      onClick={onInfoModalOpen}
                    >
                      <InfoOutlineIcon />
                    </Button>
                  </Tooltip>
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
            <Tooltip
              key={vote.id}
              label={vote.players.name ?? "Unnamed Player"}
            >
              <Avatar
                size={"sm"}
                className="slideIn"
                name={vote.players.name ?? "?"}
              />
            </Tooltip>
          ))}
        </AvatarGroup>
      </Card>

      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={rsvpDialogCancelRef}
        onClose={onRsvpDialogClose}
        isOpen={isRsvpDialogOpen}
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
            <Button onClick={onRsvpDialogClose}>Cancel</Button>
            <Button
              colorScheme="green"
              ml={"3"}
              onClick={() =>
                rsvp().then(() => toggleVote(false).then(onRsvpDialogClose))
              }
            >
              RSVP & Vote
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityInfoModal
        activity={activity}
        playerMetadata={playerMetadata}
        isOpen={isInfoModalOpen}
        onClose={onInfoModalClose}
      />
    </>
  );
}

function ActivityInfoModal({
  isOpen,
  onClose,
  activity,
  playerMetadata,
}: {
  isOpen: boolean;
  activity: Activity;
  onClose: UseModalProps["onClose"];
  playerMetadata?: PlayerActivityMetadata;
}) {
  const { player } = useContext(AppContext);
  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: activity.setup_steps.length,
  });

  const setupSteps = activity.setup_steps as {
    title: string;
    description?: string;
  }[];

  const markSetup = async () => {
    if (!player) {
      return;
    }

    const { error } = await supabase.from("player_activity_metadata").upsert(
      {
        player_id: player.id,
        activity_id: activity.id,
        is_setup: true,
      },
      {
        onConflict: "player_id,activity_id",
      }
    );

    if (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      size={"xl"}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{activity.name} Setup Guide</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Divider marginBottom={"3"} />
          <Stack direction={"row"}>
            <Stat>
              <StatLabel>Price</StatLabel>
              <StatNumber>{formatMoney(activity.price ?? 0)}</StatNumber>
              <StatHelpText>
                {!activity.price
                  ? "Free!!!"
                  : activity.price_type === "subscription"
                  ? "subscription"
                  : "one-time"}
              </StatHelpText>
            </Stat>

            {activity.recommended_players && (
              <Stat>
                <StatLabel>Players</StatLabel>
                <StatNumber>
                  {activity.min_players ?? "?"} - {activity.max_players ?? "?"}
                </StatNumber>
                {activity.recommended_players && (
                  <StatHelpText>
                    {activity.recommended_players} recommended
                  </StatHelpText>
                )}
              </Stat>
            )}

            {activity.storage_required && (
              <Stat>
                <StatLabel>Storage Required</StatLabel>
                <StatNumber>{activity.storage_required}</StatNumber>
                <StatHelpText>Gigabytes</StatHelpText>
              </Stat>
            )}
          </Stack>

          <Divider marginY={"3"} />

          {activity.description && (
            <ReactMarkdown
              className="markdown"
              children={activity.description}
            />
          )}

          {!activity.description && !setupSteps.length && (
            <Text color={"gray.300"} marginBottom={"3"}>
              Frank is still working on getting a description and setup steps in
              for {activity.name}. Google it for now!
            </Text>
          )}
          <Stepper index={activeStep} orientation="vertical">
            {setupSteps.map((step, index) => (
              <Step key={index} onClick={() => setActiveStep(index)}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>
                <Box>
                  <StepTitle>{step.title}</StepTitle>
                  {step.description && (
                    <StepDescription style={{ wordWrap: "break-word" }}>
                      <ReactMarkdown
                        className="markdown"
                        children={step.description}
                      />
                    </StepDescription>
                  )}
                </Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        </ModalBody>
        <ModalFooter justifyContent={"self-start"}>
          <Button
            colorScheme="teal"
            onClick={markSetup}
            isDisabled={playerMetadata?.is_setup ?? false}
            leftIcon={playerMetadata?.is_setup ? <CheckIcon /> : undefined}
          >
            I own and have setup {activity.name}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ActiveEventCountdownSubtitle() {
  const now = useNow();

  const { activeEvent } = useContext(AppContext);

  if (!activeEvent) {
    return null;
  }

  const eventStart = new Date(activeEvent.start_at);

  if (now > eventStart) {
    return null;
  }

  const distance = formatDistance(eventStart, now, {
    addSuffix: true,
  });
  const formatted = format(eventStart, "EEEE 'at' p 'ET'");

  return (
    <Text lineHeight={"taller"} fontSize={["2xl", null, "3xl"]}>
      We start in{" "}
      <Tooltip placement="right" label={formatted}>
        <strong>{distance}</strong>
      </Tooltip>
    </Text>
  );
}

/** Overview of active event displaying RSVPs, votes, and actions to RSVP. */
function ActiveEventView() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const chartRef = useRef<any>();
  const cancelRef =
    useRef<AlertDialogProps["leastDestructiveRef"]["current"]>(null);
  const {
    player,
    user,
    activeEvent,
    activities,
    votes,
    rsvps,
    isRsvpsLoading,
  } = useContext(AppContext);

  const [teal500, teal600] = useToken("colors", ["teal.500", "teal.600"]);

  if (!user || !activeEvent || !player) {
    return null;
  }

  const isUserRsvped = rsvps.find(
    (rsvp) => rsvp.player_id === user.id && rsvp.event_id === activeEvent.id
  );

  const activitiesWithVotes: Record<string, number> = activities.reduce(
    (obj, act) => {
      const voteCount = votes.filter(
        (vote) => vote.activity_id === act.id
      ).length;
      if (voteCount) {
        return {
          ...obj,
          [act.name]: voteCount,
        };
      }
      return obj;
    },
    {}
  );

  const activityNamesSortedByVotes = Object.keys(activitiesWithVotes).sort(
    (nameA, nameB) => {
      return activitiesWithVotes[nameB] - activitiesWithVotes[nameA];
    }
  );

  const data: ChartData<"bar"> = useMemo(
    () => ({
      labels: activityNamesSortedByVotes,
      datasets: [
        {
          label: "Votes",
          data: activityNamesSortedByVotes.map(
            (name) => activitiesWithVotes[name]
          ),
          borderColor: teal500,
          backgroundColor: teal600,
        },
      ],
    }),
    [activitiesWithVotes]
  );

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
        // @ts-ignore
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 1 },
        });
      }
    }
  };

  const handleVoteGraphClick: React.MouseEventHandler<HTMLCanvasElement> = (
    event
  ) => {
    const element = getElementAtEvent(chartRef.current, event)[0];
    if (!element) {
      return;
    }
    const activityName = activityNamesSortedByVotes[element.index];
    if (!activityName) {
      return;
    }
    const activityID = activities.find((act) => act.name === activityName)?.id;
    if (!activityID) {
      return;
    }
    document.getElementById("activity-" + activityID)?.scrollIntoView();
  };

  return (
    <>
      <Box p={"6"} borderRadius={"lg"} my={"10"}>
        <Flex gap={"3"} direction={{ base: "column", md: "row" }}>
          <Stack flex={"1"}>
            <Heading as="h3">
              {votes.length === 0
                ? "No Votes"
                : votes.length === 1
                ? "1 Vote"
                : `${votes.length} Votes`}{" "}
              Cast
            </Heading>
            <Bar
              ref={chartRef}
              options={options}
              data={data}
              height={"100%"}
              onClick={handleVoteGraphClick}
            />
          </Stack>
          <Stack spacing={"5"} flex={"1"}>
            <Heading as="h3">Who's Coming?</Heading>
            <Skeleton
              isLoaded={!isRsvpsLoading}
              width={"100%"}
              display={"flex"}
            >
              {rsvps.length === 0 && (
                <Text>Nobody yet. Be the first to RSVP!</Text>
              )}
              <Wrap spacing={"3"}>
                {rsvps?.map((rsvp) => (
                  <WrapItem key={rsvp.player_id} className="slideIn from-right">
                    <Tooltip label={rsvp.players.name ?? "Unnamed Player"}>
                      <Avatar name={rsvp.players.name ?? "?"}></Avatar>
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
              <Button
                colorScheme={"green"}
                onClick={() => toggleRSVP()}
                id="rsvp-button"
              >
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
function UnverifiedPlayerView() {
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
  const now = useNow();
  const {
    player,
    activeEvent,
    activitiesError,
    activities,
    isActivitiesLoading,
  } = useContext(AppContext);

  const canVote = player?.is_verified && !!activeEvent;

  const activtyMetadataFilters = useMemo<RowFilters>(() => {
    if (player) {
      return {
        initial: [["player_id", "eq", player?.id]],
        update: `player_id=eq.${player?.id}`,
      };
    } else {
      return false;
    }
  }, [player]);
  const [_, activityMetadatasError, activityMetadatas] =
    useRows<PlayerActivityMetadata>(
      "player_activity_metadata",
      activtyMetadataFilters
    );

  useEffect(() => {
    if (activityMetadatasError) {
      console.error(activityMetadatasError);
    }
  }, [activityMetadatasError]);

  /** Activites sorted by favorite and then by name A-Z. */
  const sortedActivities = useMemo(
    () =>
      activities.sort((actA, actB) => {
        const isAFavorite =
          activityMetadatas.find((m) => m.activity_id === actA.id)
            ?.is_favorite ?? false;
        const isBFavorite =
          activityMetadatas.find((m) => m.activity_id === actB.id)
            ?.is_favorite ?? false;

        if (isAFavorite > isBFavorite) {
          return -1;
        } else if (isBFavorite > isAFavorite) {
          return 1;
        } else {
          return actA.name.localeCompare(actB.name);
        }
      }),
    [activities, activityMetadatas]
  );

  return (
    <>
      <Heading>
        {canVote
          ? `What do you want to play ${formatRelative(
              new Date(activeEvent.start_at),
              now
            )}?`
          : "Our Activities"}
      </Heading>
      {activitiesError && (
        <Alert status="error" my={"5"}>
          <AlertIcon /> There was an error fetching the activities. Blame Frank
          and try again later!
        </Alert>
      )}
      <SimpleGrid columns={[1, 2, 3]} spacing={10} my={10}>
        {isActivitiesLoading && !sortedActivities
          ? [1, 2, 3, 4, 5, 6, 7].map((_, index) => (
              <ActivitySkeleton key={index} />
            ))
          : sortedActivities!.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                playerMetadata={activityMetadatas.find(
                  (m) => m.activity_id === activity.id
                )}
              />
            ))}
      </SimpleGrid>

      <Popover placement="auto">
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

function LoggedOutView() {
  return (
    <Container maxW="container.lg">
      <Stack p={"10"} spacing={5} borderWidth={1} borderRadius={"lg"}>
        <Heading
          as="h1"
          textAlign={"center"}
          fontSize={{ base: "5xl", md: "7xl" }}
        >
          Rathskeller Game Night
        </Heading>

        <Button size={"lg"} onClick={() => signInWithDiscord()}>
          Login with Discord
        </Button>
      </Stack>
    </Container>
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
    const now = new Date();

    return (
      events.find((event) => {
        const eventStart = new Date(event.start_at);
        const eventActiveInterval: Interval = {
          start: subDays(eventStart, 1),
          end: event.end_at ? new Date(event.end_at) : endOfDay(eventStart),
        };
        return isWithinInterval(now, eventActiveInterval);
      }) ?? null
    );
  }, [events]);

  // Memo-ize filters to not cause wasteful re-renders
  const voteFilters = useMemo<RowFilters>(() => {
    if (activeEvent) {
      return {
        initial: [["event_id", "eq", activeEvent?.id.toString()]],
        update: `event_id=eq.${activeEvent?.id}`,
      };
    } else {
      return false;
    }
  }, [activeEvent]);

  // Fetch votes for the active event
  const [isVotesLoading, votesError, votes] = useRows<
    AppContext["votes"][number]
  >("votes", voteFilters, "*,players(name)");
  // Fetch logged in user and their player profile (or null)
  const [isUserLoading, user] = useUser();
  const [isPlayerLoading, playerError, player] = useRow<Player>(
    "players",
    user?.id
  );

  // Memo-ize filters to not cause wasteful re-renders
  const rsvpFilters = useMemo<RowFilters>(() => {
    if (activeEvent) {
      return {
        initial: [["event_id", "eq", activeEvent?.id.toString()]],
        update: `event_id=eq.${activeEvent?.id}`,
      };
    } else {
      return false;
    }
  }, [activeEvent]);
  // Fetch active event RSVPs
  const [isRsvpsLoading, rsvpsError, rsvps] = useRows<
    AppContext["rsvps"][number]
  >("rsvps", rsvpFilters, "*,players(name)");

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
              {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            </Button>
          </Tooltip>
        </Flex>
      </Container>
      {isUserLoading ? (
        <Center height={"80vh"}>
          <Spinner size={"xl"} />
        </Center>
      ) : user ? (
        <Container maxW={"container.lg"} mb="10">
          <main>
            <Heading as="h1" size={["2xl", null, "3xl"]}>
              Rathskeller Game Night
            </Heading>
            <ActiveEventCountdownSubtitle />

            <Skeleton
              isLoaded={!isPlayerLoading && !isEventsLoading && !!player}
            >
              {player?.is_verified ? (
                activeEvent ? (
                  <ActiveEventView />
                ) : (
                  <NoActiveEventView />
                )
              ) : (
                <UnverifiedPlayerView />
              )}
            </Skeleton>
            <Divider marginY={"8"} />
            <ActivityView />
          </main>
        </Container>
      ) : (
        <LoggedOutView />
      )}
    </AppContext.Provider>
  );
}

export default App;

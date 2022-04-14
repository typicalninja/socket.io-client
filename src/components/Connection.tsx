import React from "react";
import { State } from "../App";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";

import AddIcon from "@mui/icons-material/Add";
import { Socket } from "socket.io-client";

const tryAndNull = (fn: () => any, async: boolean) => {
	if(!async) {
		try { return fn(); } catch(e) { return null; }
	}
	else {
		return new Promise((resolve, reject) => fn().then(resolve).catch(reject));
	}
}

// from mui docs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel_${index}`}
      aria-labelledby={`tab_${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ConnectionInfo(props: State) {
  if (props.connectionData.socketID === null)
    return <Typography>No Connection</Typography>;
  return (
    <Box>
      <Stack spacing={4} direction="column">
        <Typography>
          Socket ID:{" "}
          <Typography variant="caption" color="success">
            {props.connectionData.socketID}
          </Typography>
        </Typography>
        <Typography>
          Uri:{" "}
          <a href={props.uri || "#NOTFOUND"} rel="noreferrer" target="_blank">
            {props.uri}
          </a>
        </Typography>
        <Typography>Connection Settings</Typography>
        <CodeMirror
          value={JSON.stringify(props.ioOptions, null, 2)}
          height="300px"
          extensions={[json()]}
          theme="dark"
          editable={false}
          /* @ts-ignore */
          readOnly={true}
        />
      </Stack>
    </Box>
  );
}

export default function Connection(props: State) {
  const [currentTab, setCurrentTab] = React.useState(0);

  const [listeningEvents, setListeningEvents] = React.useState<
    { eventName: string; logged: { message: string; time: number }[] }[]
  >([]);
  const [emittedEvents, setEmittedEvents] = React.useState<
    { eventName: string; type: string; emitData: string; spreadData: boolean }[]
  >([]);

  React.useEffect(() => {
	// load events from local storage 
	const stored_EmittedEvents = localStorage.getItem('emittedEvents');
	const stored_ListeningEvents = localStorage.getItem('listeningEvents');
	console.log(`Loading events from local storage [${(stored_EmittedEvents ? 'stored Emitted Events were found' : 'No Stored Emitted Events found')} && ${(stored_ListeningEvents ? 'stored Listening Events were found' : 'No Stored Listening Events found')}]`);
	if (stored_EmittedEvents) {
		const parsed_EmittedEvents = tryAndNull(() => JSON.parse(stored_EmittedEvents), false);
		if(parsed_EmittedEvents) {
			setEmittedEvents((prev) => {
				return [
					...prev,
					...parsed_EmittedEvents.filter(
					(e: { eventName: string }) =>
						!prev.find((p) => p.eventName === e.eventName)
					),
				]
			});
		}
		else { console.warn(`Failed to parse emittedEvents from localStorage`); }
	}

	if (stored_ListeningEvents) {
		const parsed_ListeningEvents = tryAndNull(() => JSON.parse(stored_ListeningEvents), false);
		if(parsed_ListeningEvents) {
			setListeningEvents((prev) => {
				return [
					...prev,
					...parsed_ListeningEvents.filter(
					(e: { eventName: string }) =>
						!prev.find((p) => p.eventName === e.eventName)
					),
				]
			});
		}
		else { console.warn(`Failed to parse listeningEvents from localStorage`); }
	}

  }, [])

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={currentTab} onChange={handleChange} aria-label="tabs">
          <Tab label="Received" id="tab_0" />
          <Tab label="Emit" id="tab_1" />
          <Tab label="Socket Data" id="tab_2" />
        </Tabs>
      </Box>
      <TabPanel value={currentTab} index={0}>
        {props.connectionData.socket && (
          <ListenTab
            emittingEvent={{ setListeningEvents, listeningEvents }}
            socket={props.connectionData.socket}
          />
        )}
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        {props.connectionData.socket && (
          <EmitTab
            listeningEvent={{ setEmittedEvents, emittedEvents }}
            socket={props.connectionData.socket}
          />
        )}
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        <ConnectionInfo {...props} />
      </TabPanel>
    </Box>
  );
}

function EmitTab(props: {
  socket: Socket;
  listeningEvent: {
    emittedEvents: { eventName: string; type: string; emitData: string; spreadData: boolean }[];
    setEmittedEvents: any;
  };
}) {
  const [newEvent, setNewEvent] = React.useState({
    eventName: "",
    type: "JSON",
    emitData: "",
    spreadData: false,
  });

  const [error, setError] = React.useState<null | string>(null);

  const [events, setEvents] = React.useState<
    { eventName: string; type: string; emitData: string; spreadData: boolean }[]
  >(props.listeningEvent.emittedEvents || []);
  const [inspector, setInspector] = React.useState({
    event: "",
    data: "",
    type: "JSON",
    open: false,
    spreadData: true
  });

  const onAddEvent = () => {
    if (newEvent.eventName === "") return alert(`Event name cannot be empty`);
    if(newEvent.spreadData === true && newEvent.type !== 'JSON') return alert(`Spread data is only available for JSON type events`);
    if(newEvent.type === 'JSON' && newEvent.emitData === '') return alert(`JSON data cannot be empty`);
    // if (newEvent.emitData === "") return alert(`Event data cannot be empty`);
    setEvents((prev) => {
      onEmit(newEvent.eventName, false);
      return [
        ...prev,
        {
          eventName: newEvent.eventName,
          emitData: newEvent.emitData || ' ',
          type: newEvent.type,
          spreadData: newEvent.spreadData
        },
      ];
    });
    props.listeningEvent.setEmittedEvents(
      (prev: { eventName: string; type: string; emitData: string }[]) => [
        ...prev,
        {
          eventName: newEvent.eventName,
          emitData: newEvent.emitData || ' ',
          type: newEvent.type,
          spreadData: newEvent.spreadData
        },
      ]
    );
    // reset the inputs
    setNewEvent((prev) => ({
      eventName: "",
      emitData: "",
      type: prev.type,
      spreadData: prev.spreadData
    }));
    setError(null);
    // set to local storage
    try {
      const old = JSON.parse(localStorage.getItem("emittedEvents") || "[]");
      localStorage.setItem(
        "emittedEvents",
        JSON.stringify([
          ...old,
          {
            eventName: newEvent.eventName,
            emitData: newEvent.emitData,
            type: newEvent.type,
            spreadData: newEvent.spreadData
          },
        ])
      );
    } catch {}
    return true;
  };

  const onEmit = (eventName: string, log: boolean = true) => {
    const EmittingEvent = events.find((e) => e.eventName === eventName);
    if (!EmittingEvent) return alert(`Event ${eventName} not found`);

    const data =
      EmittingEvent.type === "JSON"
        ? JSON.parse(EmittingEvent.emitData)
        : EmittingEvent.emitData;
    // support emit without log
    if (log) {
      setEvents((prev) => [
        ...prev,
        {
          eventName: EmittingEvent.eventName,
          emitData: EmittingEvent.emitData,
          type: EmittingEvent.type,
          spreadData: EmittingEvent.spreadData
        },
      ]);
      props.listeningEvent.setEmittedEvents(
        (prev: { eventName: string; type: string; emitData: string }[]) => [
          ...prev,
          {
            eventName: EmittingEvent.eventName,
            emitData: EmittingEvent.emitData,
            type: EmittingEvent.type,
            spreadData: EmittingEvent.spreadData
          },
        ]
      );
    }
    console.log(`Sending Event ${EmittingEvent.eventName} [spread: ${EmittingEvent.spreadData} :: type: ${EmittingEvent.type}]`, data);
    if(EmittingEvent.spreadData) {
      props.socket.emit(EmittingEvent.eventName, ...Object.values(data));
    }
    else {
      props.socket.emit(EmittingEvent.eventName, data);
    }
  };

  /*React.useEffect(() => {
    // load the events from local storage
    const storedEvents = localStorage.getItem("emittedEvents");
    if (storedEvents) {
      try {
        const d = JSON.parse(storedEvents);
        const c = (
          prev: { eventName: string; type: string; emitData: string }[]
        ) => {
          // filter out duplicates
          // and merge the 2 arrays
          return [
            ...prev,
            ...d.filter(
              (e: { eventName: string }) =>
                !prev.find((p) => p.eventName === e.eventName)
            ),
          ];
        };
        setEvents(c);
        props.listeningEvent.setEmittedEvents(c);
      } catch {
        console.log("Failed at Task :: load stored events");
      }
    }
  }, []);*/

  return (
    <Box>
      <Stack spacing={4} direction="column">
        <Typography>Emit Events</Typography>
        <Stack spacing={3} direction="column">
          <Stack spacing={2} direction="row">
            <TextField
              label="Event Name"
              variant="outlined"
              value={newEvent.eventName}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={onAddEvent} aria-label="add event">
                    <AddIcon />
                  </IconButton>
                ),
              }}
              onChange={(e) =>
                setNewEvent((prev) => ({ ...prev, eventName: e.target.value }))
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newEvent.type === "JSON"}
                  onClick={() =>
                    setNewEvent((prev) => ({
                      ...prev,
                      type: prev.type === "JSON" ? "TEXT" : "JSON",
                      spreadData: prev.type === "JSON" ? prev.spreadData : false,
                    }))
                  }
                />
              }
              label={`Send ${newEvent.type.toLowerCase()}`}
            />
             <FormControlLabel
              control={
                <Switch
                  disabled={newEvent.type !== "JSON"}
                  checked={(newEvent.spreadData && newEvent.type === "JSON")}
                  onClick={() =>
                    setNewEvent((prev) => ({
                      ...prev,
                      spreadData: prev.spreadData ? false : true,
                    }))
                  }
                />
              }
              label={`${newEvent.type === 'JSON' ? newEvent.spreadData === true ? 'will spread (json) data' : 'will not spread' : '[Only available for JSON type data]'} Spread Data`}
            />
          </Stack>
          <Typography>Event Data</Typography>
          <CodeMirror
            value={newEvent.emitData}
            height="150px"
            theme="dark"
            onChange={(value) => {
              if (newEvent.type === "JSON") {
                try {
                  JSON.parse(value);
                  setNewEvent((prev) => ({ ...prev, emitData: value }));
                  setError(null);
                } catch (e) {
                  setError("Invalid Json Data");
                }
              } else {
                setNewEvent((prev) => ({ ...prev, emitData: value }));
                setError(null);
              }
            }}
            extensions={[json()]}
          />
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Typography>Emitted</Typography>
          <Box sx={{ overflowY: "auto", height: "300px" }}>
            <Box sx={{ overflowY: "auto", height: "300px" }}>
              {events.map((event, index) => (
                <Box
                  key={index}
                  sx={{ borderBottom: 1, borderColor: "divider" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography>{event.eventName}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button onClick={() => onEmit(event.eventName)}>
                      Emit
                    </Button>
                    <Button
                      onClick={() => {
                        // update the local storage
                        const storedEvents =
                          localStorage.getItem("emittedEvents");
                        if (storedEvents) {
                          try {
                            const d = JSON.parse(storedEvents);
                            const c = d.filter(
                              (e: { eventName: string }) =>
                                e.eventName !== event.eventName
                            );
                            localStorage.setItem(
                              "emittedEvents",
                              JSON.stringify(c)
                            );
                          } catch {}
                        }
                        setEvents((prev) => prev.filter((e, i) => i !== index));
                        props.listeningEvent.setEmittedEvents(
                          events.filter((e, i) => i !== index)
                        );
                      }}
                    >
                      <Typography color="error" variant="button">
                        Remove
                      </Typography>
                    </Button>
                    <Button
                      onClick={() => {
                        setInspector({
                          event: event.eventName,
                          data: event.emitData,
                          type: event.type,
                          open: true,
                          spreadData: event.spreadData,
                        });
                      }}
                    >
                      <Typography color="green" variant="button">
                        Inspect
                      </Typography>
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        <Dialog
          open={inspector.open}
          onClose={() => setInspector({ ...inspector, open: false })}
          fullWidth
        >
          <DialogTitle>Event Inspector</DialogTitle>
          <DialogContent>
            <Stack spacing={2} direction="column">
              <Typography>Event: {inspector.event}</Typography>
              <Typography>Data Type: {inspector.type.toLowerCase()}</Typography>
              <Typography>Data Spreading: {inspector.spreadData === true ? 'on' : 'off'}</Typography>
              <Typography>Data:</Typography>
              <CodeMirror
                value={inspector.data}
                height="150px"
                theme="dark"
                editable={false}
                extensions={[json()]}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setInspector({ ...inspector, open: false })}
              color="primary"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}

function ListenTab({
  socket,
  emittingEvent,
}: {
  socket: Socket;
  emittingEvent: {
    setListeningEvents: any;
    listeningEvents: {
      eventName: string;
      logged: { message: string; time: number }[];
    }[];
  };
}) {
  const [listening, setListening] = React.useState<
    { eventName: string; logged: { message: string; time: number }[] }[]
  >(emittingEvent.listeningEvents || []);
  const [ListeningEventInspector, setListeningEvent] = React.useState<{
    event: string;
    open: boolean;
    logged: { message: string; time: number }[];
  }>({
    event: "",
    open: false,
    logged: [],
  });

  const [newListen, setNewListen] = React.useState({
    eventName: "",
  });

  const [expanded, setExpanded] = React.useState<string | false>(false);
  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const onAddListener = () => {
    console.log(`Added event listener: ${newListen.eventName}`);
    if (!newListen.eventName || newListen.eventName === "")
      return alert("Please enter an event name");
    setListening((prev) => [
      ...prev,
      { eventName: newListen.eventName, logged: [] },
    ]);
    emittingEvent.setListeningEvents(
      (
        prev: {
          eventName: string;
          logged: { message: string; time: number }[];
        }[]
      ) => [...prev, { eventName: newListen.eventName, logged: [] }]
    );
    socket.on(newListen.eventName, (...data) => {
      console.log(`Received event: ${newListen.eventName} :: `, ...data);
      const c = (
        prev: {
          eventName: string;
          logged: { message: string; time: number }[];
        }[]
      ) => {
        return prev.map((e) => {
          if (e.eventName === newListen.eventName) {
            return {
              ...e,
              logged: [
                ...e.logged,
                { message: JSON.stringify(data), time: Date.now() },
              ],
            };
          }
          return e;
        });
      };
      setListening(c);
      emittingEvent.setListeningEvents(c);
    });
    setNewListen({ eventName: "" });

	// update the local storage
	const old = JSON.parse(localStorage.getItem("listeningEvents") || "[]");
	localStorage.setItem(
		"listeningEvents",
		JSON.stringify([...old, { eventName: newListen.eventName, logged: [] }])
	);
  };

  // attach event listener to the event from localstorage
  React.useEffect(() => {
	// listening already has the events stored in local storage from mother component
	// so we don't need to add them again
	console.log(`Pre Loading events: ${listening.length}`)
	listening.forEach((l) => {
    // ensure that the event is not already attached
    if (!socket.listeners(l.eventName).length) {
      console.log(`Event ${l.eventName} was preLoaded`)
      socket.on(l.eventName, (data) => {
        console.log(`Received event: ${l.eventName}`, data);
        const c = (
          prev: {
            eventName: string;
            logged: { message: string; time: number }[];
          }[]
        ) => {
          return prev.map((e) => {
            if (e.eventName === l.eventName) {
              return {
                ...e,
                logged: [
                  ...e.logged,
                  { message: JSON.stringify(data), time: Date.now() },
                ],
              };
            }
            return e;
          });
        };
        setListening(c);
        emittingEvent.setListeningEvents(c);
      });
   }
	});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 /* React.useEffect(() => {
    // load the events from local storage
    const storedEvents = localStorage.getItem("listeningEvents");
	// need to set to state and attach a event
	if (storedEvents) {
		try {
			const d = JSON.parse(storedEvents);
			setListening(d);
			emittingEvent.setListeningEvents(d);
		}
		catch {}
	}
  }, []);*/

  return (
    <Stack spacing={2} direction="column">
      <Stack spacing={2} direction="column">
        <Typography color="green">New Event</Typography>
          <TextField
            label="Event Name"
            value={newListen.eventName}
            onChange={(e) => setNewListen({ eventName: e.target.value })}
            InputProps={{
              endAdornment: (
                <IconButton onClick={onAddListener} aria-label="add event">
                  <AddIcon />
                </IconButton>
              ),
            }}
          />
      </Stack>
      <Typography color="green">Listening Events</Typography>
      <Box sx={{ overflowY: "auto", height: "300px" }}>
        {listening.map((event, index) => (
          <Box key={index} sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography>{event.eventName}</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                onClick={() => {
                  setListeningEvent({
                    event: event.eventName,
                    open: true,
                    logged: event.logged,
                  });
                }}
              >
                Inspect
              </Button>
              <Button
                color="error"
                onClick={() => {
                  // remove the event from local storage
                  const old = JSON.parse(localStorage.getItem("listeningEvents") || "[]");
                  const newEvents = old.filter((e: { eventName: string }) => e.eventName !== event.eventName);
                  localStorage.setItem("listeningEvents", JSON.stringify(newEvents));
                  socket.off(event.eventName);
                  setListening((prev) =>
                    prev.filter((e) => e.eventName !== event.eventName)
                  );
                  emittingEvent.setListeningEvents((prev: any) =>
                    prev.filter((e: any) => e.eventName !== event.eventName)
                  );
                }}
              >
                Remove
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
      <Dialog
        open={ListeningEventInspector.open}
        onClose={() => setListeningEvent((prev) => ({ ...prev }))}
        fullWidth
      >
        <DialogTitle>Receiving Event Inspector</DialogTitle>
        <DialogContent>
          <Stack spacing={2} direction="column">
            <Typography>Event: {ListeningEventInspector.event}</Typography>

            <Typography>Data:</Typography> 
            <Button 
              color="error"
              onClick={() => {
                console.log(`Cleared log of ${ListeningEventInspector.event}`)
                // set logged to []
                // clear local storage
                const old = JSON.parse(localStorage.getItem("listeningEvents") || "[]");
                const newEvents = old.map((e: any) => {
                  if (e.eventName === ListeningEventInspector.event) {
                    return {
                      ...e,
                      logged: [],
                    };
                  }
                  return e;
                });
                localStorage.setItem("listeningEvents", JSON.stringify(newEvents));

                setListeningEvent({
                  ...ListeningEventInspector,
                  logged: [],
                });
                setListening((prev) => {
                  return prev.map((e) => {
                    if (e.eventName === ListeningEventInspector.event) {
                      return {
                        ...e,
                        logged: [],
                      };
                    }
                    return e;
                  });
                })
                emittingEvent.setListeningEvents((prev: any) => {
                  return prev.map((e: { eventName: string; logged: {}[] }) => {
                    if (e.eventName === ListeningEventInspector.event) {
                      return {
                        ...e,
                        logged: [],
                      };
                    }
                    return e;
                  });
                });
              }}
            ><DeleteOutlinedIcon /> Clear log</Button>
            {ListeningEventInspector.logged.map((log, index) => (
              <Accordion
                key={`accordion_panel_${index}_${log.time}`}
                expanded={expanded === `panel_${index}_${log.time}`}
                onChange={handleChange(`panel_${index}_${log.time}`)}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel_${index}_${log.time}_header`}
                  id={`panel_${index}_${log.time}_header`}
                >
                  <Typography
                    color="grey"
                    variant="caption"
                    sx={{ width: "38%", flexShrink: 0 }}
                  >
                    {/* format time here it in milliseconds from Date.now() */}
                    {new Date(log.time).toLocaleString()}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    {ListeningEventInspector.event}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeMirror
                    value={log.message}
                    height="150px"
                    theme="dark"
                    editable={false}
                    extensions={[json()]}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setListeningEvent((prev) => ({ ...prev, open: false }))
            }
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

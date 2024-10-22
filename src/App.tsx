import React from 'react';
import { Socket, io } from "socket.io-client";

import Connect from './components/Connect';
import Connecting from './components/Connecting';
import Error from './components/Error';
import Connection from './components/Connection';
import Disconnected from './components/Disconnected';


import Box from '@mui/material/Box';


export const CONN_STATES = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  ERROR: 3,
  IDLE: 4,
}

export type State = {
  status: number;
  error: string | null
  uri: string | null;
  ioOptions: {
    transports: string[];
    timeout: number;
    forceNew: boolean;
    reconnection: boolean;
    reconnectionDelay: number;
    reconnectionAttempts: number;
    path: string;
  },
  connectionData: {
    socket: Socket | null;
    socketID: string | null;
  }
}


class App extends React.Component {
  state: State
  constructor(props: any) {
    super(props);
    this.state = {
      status: CONN_STATES.IDLE,
      error: null,
      uri: localStorage.getItem('uri') || null,
      ioOptions: {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
        path: '/socket.io'
      },
      connectionData: {
        socket: null,
        socketID: null,
      }
    }
  }
  getLocalStorageOptions(): State['ioOptions'] {
    const lcl = localStorage.getItem('config')
    if (lcl) {
      const options = JSON.parse(lcl)
      return options;
    }
    else {
      const options = {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
        path: '/socket.io'
      }
      this.saveLocalStorageOptions(options)
      return options;
    };
  }
  saveLocalStorageOptions(options: any) {
    localStorage.setItem('config', JSON.stringify(options))
  }
  componentDidMount() {
    const options = this.getLocalStorageOptions()
    this.setOptions(options)
  }
  setOptions(newOptions: State['ioOptions']) {
    this.setState({
      ioOptions: {
        ...newOptions
      }
    })
    this.saveLocalStorageOptions(newOptions)
  }
  setUri(uri: string) {
    this.setState({
      uri: uri
    })
    localStorage.setItem('uri', uri)
  }
  connect() {
    const options = this.state.ioOptions
    if(!this.state.uri) return "No Connection uri"
    const socket = io(this.state.uri, options)
    this.setState({
      status: CONN_STATES.CONNECTING,
      connectionData: {
        socket: socket,
      }
    })
    socket.on('connect', () => {
      this.setState({
        status: CONN_STATES.CONNECTED,
        connectionData: {
          socket: socket,
          socketID: socket.id
        }
      });
    });

    socket.on('connect_error', (err: any) => {
      console.log(`MAIN :: connect_error: ${err}`)
      this.setState({
        status: CONN_STATES.ERROR,
        error: err.message || 'Unknown error'
      });
      //socket.removeAllListeners()
    });

    socket.on('disconnect', (err: any) => {
      console.log(`MAIN :: disconnect: ${err}`)
      this.setState({
        status: CONN_STATES.DISCONNECTED,
        error: err.message || 'Unknown error'
      });
    });

  }
  error_OnBack() {
    // set most to previous values
    if(this.state.connectionData.socket) {
      // remove all listeners so it doesn't reconnect if the server is working again
      try {
        this.state.connectionData.socket.removeAllListeners();
        this.state.connectionData.socket.disconnect()
        console.log(`MAIN :: disconnecting socket ${this.state.connectionData.socketID} and removing listeners`)
      } catch(e) {
        console.log("MAIN :: error_OnBack :: error removing listeners", e)
       }
    }
    this.setState({
      status: CONN_STATES.IDLE,
      error: null,
      connectionData: {
        socket: null,
        socketID: null,
      },
    })
  }
  render() {
    return (
      <Box>
        {
          // idle only appears when there is no connection and no connection was attempted
          this.state.status === CONN_STATES.IDLE &&
            <Connect {...this.state} onConnectClick={this.connect.bind(this)} setOptions={this.setOptions.bind(this)} setUri={this.setUri.bind(this)} />
        }
        {
          // next is connecting and is show when the connection is in progress
          this.state.status === CONN_STATES.CONNECTING  &&
          <Connecting {...this.state} />
        }
        {
          this.state.status === CONN_STATES.DISCONNECTED &&
          <Disconnected {...this.state} onBack={this.error_OnBack.bind(this)} onConnectClick={this.connect.bind(this)} setOptions={this.setOptions.bind(this)} setUri={this.setUri.bind(this)} />
        }
        {
          // next is Error and is shown when the connection failed
          this.state.status === CONN_STATES.ERROR &&
          <Error {...this.state} onBack={this.error_OnBack.bind(this)} />
        }
        {
          // next is connected and is shown when the connection is successful
          this.state.status === CONN_STATES.CONNECTED &&
          // @ts-ignore
          <Connection {...this.state} onBack={this.error_OnBack.bind(this)} />
        }
      </Box>
    );
  }
}

/*function App() {
  const [conn, setConn] = React.useState({
    status: CONN_STATES.DISCONNECTED,
    error: null,
    connection: null,
    uri: null,

  });
  return (

  );
}*/

export default App;

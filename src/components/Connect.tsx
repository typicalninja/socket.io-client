import React from 'react'

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from "@mui/material/Typography";

import { State } from "../App";

export default function Modal({ onConnectClick, setOptions, uri, setUri, ioOptions }: { status: number, onConnectClick: any, setOptions: any, ioOptions: State["ioOptions"], setUri: any; uri: string | null }) {

    const [errors, setErrors] = React.useState<{ optionsError: string | null; uriError: null | string }>({
        optionsError: null,
        uriError: 'Uri Needs to be filled',
    });

    React.useEffect(() => {
        if(uri !== "") {
            // localhost had a value saved
            setErrors((prev) => ({ ...prev, uriError: null }))
        }
    }, [uri]);

    return (
        <Dialog open={true} onClose={() => null}>
            <DialogTitle>Connect</DialogTitle>
            <DialogContent>
                <DialogContentText>
                   Please enter the IP address of the server you want to connect to.
                    You can modify the options in the JSON Editor.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="uri"
                    label="Socket.io address"
                    type="text"
                    fullWidth
                    variant="standard"
                    defaultValue={uri}
                    onChange={(ev) => {
                        const uri = ev.target.value;
                        if(uri === "") return setErrors((prev) => ({ ...prev, uriError: 'Uri Cannot be Empty' }));
                        else {
                            setErrors((prev) => ({ ...prev, uriError: null }));
                            setUri(uri);
                        }
                    }}
                />
                <CodeMirror
                    value={JSON.stringify(ioOptions, null, 2)}
                    height="200px"
                    extensions={[json()]}
                    onChange={(value) => {
                        try {
                            const newOptions = JSON.parse(value)
                            setOptions(newOptions)
                            console.log('Updated the options')
                            setErrors((prev) => ({
                                ...prev,
                                optionsError: null,
                            }));

                        } catch (e) {
                            console.error('Invalid JSON', e)
                            setErrors((prev) => ({
                                ...prev,
                                optionsError: 'Json Invalid...',
                            }))
                        }
                    }}
                    theme={'dark'}
                />
                {/* Error in options is displayed here in red text */}
                {errors.optionsError && <Typography color="error">{errors.optionsError}</Typography>}
                {errors.uriError && <Typography color="error">{errors.uriError}</Typography>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onConnectClick || (() => null)} color={"success"} disabled={(errors.optionsError || errors.uriError) ? true : false}>Connect</Button>
            </DialogActions>
        </Dialog>
    )
}
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function Error({ error, onBack, onConnectClick, setOptions, setUri }: { error: string | null; onBack: any; onConnectClick: any, setOptions: any, setUri: any; }) {
	if(!error) return null;
	return (
		<Dialog open={true} onClose={() => null} fullWidth>
			<DialogTitle>Disconnected</DialogTitle>
			<DialogContent>
				<DialogContentText>
					<Stack direction="column" spacing={1}>
						<Typography variant="body1" color="success">
							The socket.io connection has been lost.
							{" "}
							If we can Reconnect to the server you will be sent back to connection controls page.
							{" "}
							To Exit and close all connections Click <b>"Back to Connect"</b>
							{" "}
							Or Click <b>"Try Again"</b> to reconnect.
						</Typography>
					</Stack>
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onBack}>
					<Typography variant="button">
						Back to Connect
					</Typography>
				</Button>
				<Button onClick={onConnectClick}>
					<Typography variant="button" color={"success"}>
						Try Again
					</Typography>
				</Button>
			</DialogActions>
		</Dialog>
	)
}

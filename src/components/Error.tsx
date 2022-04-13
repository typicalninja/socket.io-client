import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function Error({ error, onBack }: { error: string | null; onBack: any }) {
	if(!error) return null;
	return (
		<Dialog open={true} onClose={() => null} fullWidth>
			<DialogTitle>Error Occurred</DialogTitle>
			<DialogContent>
				<DialogContentText>
					<Stack direction="column" spacing={1}>
						<Typography variant="body1" color="success">
							If socket.io can Reconnect to the server you will be sent back to connection controls page.
							{" "}
							To Exit and close all of the connections Click <Typography color="success">"Back to Connect"</Typography>
						</Typography>
						<Typography variant="caption" color="error">
							{error}
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
			</DialogActions>
		</Dialog>
	)
}

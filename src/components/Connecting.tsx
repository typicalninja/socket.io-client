import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
//import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

export default function Connecting({ uri }: { uri: string | null }) {
   if(!uri) return null;
   return (
        <Dialog open={true} onClose={() => null}>
            <DialogTitle>Connecting to socket</DialogTitle>
            <DialogContent>
                <DialogContentText>
                  <Stack spacing={3} direction="row">
                    <CircularProgress size={20} />
                    <b>Connecting to "{uri}"</b>
                  </Stack>
                </DialogContentText>
            </DialogContent>
        </Dialog>
   )
}
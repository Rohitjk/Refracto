import { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Button,
  Paper,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Menu as MenuIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TicketList from '../components/TicketList';
import CodeDisplay from '../components/CodeDisplay';
import ChatPrompt from '../components/ChatPrompt';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketForm from '../components/TicketForm';
import { deleteTicket, updateTicket, approveTicket, getTicket } from '../utils/api';

const drawerWidth = 320;

const TicketsPage = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [mode, setMode] = useState('view'); // 'view', 'create', 'edit'
  const [refreshTickets, setRefreshTickets] = useState(0);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Add polling effect for selected ticket
  useEffect(() => {
    let pollInterval;

    const pollTicketStatus = async () => {
      if (!selectedTicket) return;

      // Log status changes for debugging
      console.log('Polling ticket status:', {
        id: selectedTicket._id,
        currentStatus: selectedTicket.status,
        timestamp: new Date().toISOString()
      });

      try {
        const updatedTicket = await getTicket(selectedTicket._id);
        
        // Check if status changed
        if (updatedTicket.status !== selectedTicket.status) {
          console.log('Ticket status changed:', {
            id: selectedTicket._id,
            oldStatus: selectedTicket.status,
            newStatus: updatedTicket.status,
            timestamp: new Date().toISOString()
          });
          
          setSelectedTicket(updatedTicket);
          setRefreshTickets(c => c + 1);
        }
      } catch (error) {
        console.error('Error polling ticket status:', error);
      }
    };

    // Immediate check on ticket selection
    if (selectedTicket) {
      pollTicketStatus();
    }

    // Start polling if ticket is in progress
    if (selectedTicket && ['new', 'in_progress'].includes(selectedTicket.status)) {
      console.log('Starting polling for ticket:', {
        id: selectedTicket._id,
        status: selectedTicket.status,
        timestamp: new Date().toISOString()
      });
      
      // Poll every 2 seconds
      pollInterval = setInterval(pollTicketStatus, 2000);
    }

    return () => {
      if (pollInterval) {
        console.log('Stopping polling for ticket:', {
          id: selectedTicket?._id,
          status: selectedTicket?.status,
          timestamp: new Date().toISOString()
        });
        clearInterval(pollInterval);
      }
    };
  }, [selectedTicket]);

  const handleTicketCreated = (ticket) => {
    setMode('view');
    setRefreshTickets((c) => c + 1);
    setSelectedTicket(ticket);
  };

  const handleDelete = async (ticket) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      await deleteTicket(ticket._id);
      setSelectedTicket(null);
      setRefreshTickets((c) => c + 1);
    }
  };

  const handleUpdate = async (updatedTicket) => {
    await updateTicket(updatedTicket._id, {
      description: updatedTicket.description,
      generatedCode: updatedTicket.generatedCode,
      testCases: updatedTicket.testCases
    });
    setSelectedTicket((prev) => ({
      ...prev,
      description: updatedTicket.description,
      generatedCode: updatedTicket.generatedCode,
      testCases: updatedTicket.testCases
    }));
    setMode('view');
    setRefreshTickets((c) => c + 1);
  };

  const handleStartCreate = () => {
    setSelectedTicket(null);
    setMode('create');
  };

  const handleStartEdit = () => {
    setMode('edit');
  };

  const handleCancel = () => {
    setMode('view');
  };

  // const handleApproveAndApply = async () => {
  //   try {

  //     console.log("Before approve and apply");
      
  //     // setIsRefining(true);
  //     const response = await fetch(`/api/tickets/${currentTicket._id}/approve`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     console.log("Hitting approve and apply");
      
      
  //     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
  //     const updatedTicket = await response.json();
  //     setCurrentTicket(updatedTicket);
  //   } catch (error) {
  //     console.error('Error approving and applying:', error);
  //   } finally {
  //     setIsRefining(false);
  //   }
  // };

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', zIndex: 1201 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, cursor: 'pointer', userSelect: 'none' }} onClick={() => navigate('/')}> 
            <img 
              src="/ricon.svg" 
              alt="Logo" 
              style={{ 
                height: 36, 
                width: 36, 
                marginRight: 4,
                filter: 'brightness(0)'
              }} 
            />
            <Typography
              variant="h5"
              fontWeight={600}
              color="primary"
              sx={{ 
                letterSpacing: 0.5,
                fontSize: '1.5rem',
                fontFamily: '"Inter", sans-serif',
                ml: 0,
                mt: 0.5
              }}
            >
              efracto
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search tickets or entities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default'
            },
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Tickets
            </Typography>
          </Toolbar>
          <Divider />
          <TicketList
            onSelectTicket={setSelectedTicket}
            selectedTicket={selectedTicket}
            refresh={refreshTickets}
            search={search}
          />
          <Box sx={{ p: 2, mt: 'auto' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleStartCreate}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                py: 1.5
              }}
            >
              Create New Scenario
            </Button>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
            {mode === 'create' && (
              <TicketForm mode="create" onSubmit={handleTicketCreated} onCancel={handleCancel} />
            )}
            {mode === 'edit' && selectedTicket && (
              <TicketForm mode="edit" ticket={selectedTicket} onSubmit={handleUpdate} onCancel={handleCancel} />
            )}
            {mode === 'view' && selectedTicket && (
              <CodeDisplay 
                ticket={selectedTicket} 
                onDelete={handleDelete} 
                onEdit={handleStartEdit} 
                onUpdate={handleUpdate}
                onStatusChange={(status) => {
                  setSelectedTicket(prev => ({ ...prev, status }));
                }}
              />
            )}
            {mode === 'view' && !selectedTicket && (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">
                  Select a ticket to view its details
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TicketsPage; 
// // utils/videoCallService.js
// import axios from 'axios';

// export const generateVideoCallLink = async (interviewDate, interviewTime) => {
//     try {
//         const accessToken = await getZoomAccessToken();
        
//         const meetingData = {
//             topic: 'Interview Meeting',
//             type: 2, // Scheduled meeting
//             start_time: `${interviewDate}T${interviewTime}:00Z`,  // Format: YYYY-MM-DDTHH:MM:SSZ (UTC)
//             duration: 30,  // Duration in minutes (adjust as needed)
//             timezone: 'UTC',  // You can adjust this to the interviewer's timezone
//             settings: {
//                 host_video: true,
//                 participant_video: true,
//                 join_before_host: true,
//                 mute_upon_entry: true,
//                 audio: 'voip',  // 'voip' or 'both' (VoIP and phone)
//                 auto_recording: 'cloud',  // Optional: Automatically record the meeting
//             },
//         };

//         const response = await axios.post(
//             `${process.env.ZOOM_BASE_URL}/users/me/meetings`,
//             meetingData,
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             }
//         );

//         // Extract the join_url from the response
//         const zoomLink = response.data.join_url;

//         return zoomLink;
//     } catch (error) {
//         console.error('Error generating Zoom meeting link:', error.response?.data || error.message);
//         throw error;  // Handle the error appropriately (e.g., return a fallback link or throw)
//     }
// };



// const getZoomAccessToken = async () => {
//     try {
//         const response = await axios.post(
//             'https://zoom.us/oauth/token',
//             null,
//             {
//                 params: {
//                     grant_type: 'client_credentials',  // Use client credentials for OAuth
//                 },
//                 headers: {
//                     Authorization: `Basic ${Buffer.from(
//                         `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
//                     ).toString('base64')}`,  // Ensure correct encoding of client_id:client_secret
//                 },
//             }
//         );

//         // Extract and return the access token from the response
//         return response.data.access_token;
//     } catch (error) {
//         console.error('Error fetching Zoom access token:', error.response?.data || error.message);
//         throw new Error('Unable to get Zoom access token');
//     }
// };

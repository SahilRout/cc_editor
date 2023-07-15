import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();// intializes the socket 
            socketRef.current.on('connect_error', (err) => handleErrors(err));// looks for if there is a error event 
            socketRef.current.on('connect_failed', (err) => handleErrors(err));
            // function to send toast for the error event
            function handleErrors(e) {
                // console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }
            // Sending the server that we have joind and sedning the roomId and the user name with it 
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event om is for join
            socketRef.current.on(
                ACTIONS.JOINED,
                // we get a call back where we get the data we sent 
                ({ clients, username, socketId }) => {
                    // except the currnet user name notify rest of them 
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        // console.log(`${username} joined`);
                    }
                    // update the clients list 
                    setClients(clients);
                    // as soon as the new user joins we send the updated code to the server so that it can give to the new client as we want the new client to get that as soon as it joins
                    // we also sending the socket id of the new user 
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected event sent from the server 
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                // got this as a call back from the server 
                ({ socketId, username }) => {
                    // using the user name we can display this 
                    toast.success(`${username} left the room.`);
                    // we use filter to update all the clients and set the clients so that the ui gets updated
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            // on are all the listners so we clear all the listners so that there is no memory leak when the component is unmount
            socketRef.current.disconnect();
            // unscbcribing the events
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/Logo.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <a target="_blank" href="https://chat-gpt-chatbot.vercel.app/"><button className="btn gptBtn"  >
                    Use ChatGPT
                </button></a>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
        </div>
    );
};

export default EditorPage;

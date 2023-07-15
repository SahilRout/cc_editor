import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/clike/clike'
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    // stpring the editor state 
    const editorRef = useRef(null);
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: "text/x-c++src",
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            //editor instance , changes happening event listner attacked on the editor ref whih gives us two things 
            // its listnenging to 'change', 
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;// origin tells us the what thing has happend liek input cut paste 
                const code = instance.getValue(); // get the whole text we can get it from the instance
                // we need the parent component to know what the latest code is so for that we send the oncode change as a prop to parent component
                onCodeChange(code);
                if (origin !== 'setValue') {
                    // emmiting the event CODE_CHANGE we sending the data of room_id and the code which we got from instance
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            // so we get the code change event from the server and update the code we listning or socket ref
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    // set value bascialy directly sets what ever you give it to set like useState but for ref
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            // swithcing it off
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
        // if only we get socket ref
    }, [socketRef.current]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;

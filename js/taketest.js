
   
        const questions = [
            { key: 'name', text: 'Please enter your name:' },
            { key: 'age', text: 'Please enter your age:', isNumber: true },
            { key: 'sick', text: 'Are you feeling sick? (yes/no)', valid: ['yes', 'no'] },
            { key: 'symptom', text: 'Are you feeling cold or fever? (cold/fever/yes/no)', valid: ['yes', 'no', 'cold', 'fever'] }
        ];

        let state = {
            index: 0,
            data: {},
            result: ''
        };

        function startCheckup() {
            state.index = 0;
            state.data = {};
            state.result = '';
            document.getElementById('result').innerText = '';
            document.getElementById('question-container').style.display = 'block';
            showQuestion();
        }

        function showQuestion(text = null) {
            const question = text || questions[state.index]?.text;
            document.getElementById('question').innerText = question;
            document.getElementById('userInput').value = '';
            document.getElementById('userInput').focus();
        }

        function submitAnswer() {
            const input = document.getElementById('userInput').value.trim();
            const currentQ = questions[state.index];
            if (!currentQ || !input) return;
            const normalizedInput = input.toLowerCase();

            if (currentQ.valid && !currentQ.valid.includes(normalizedInput)) {
                alert('Please enter: ' + currentQ.valid.join(' / '));
                return;
            }
            if (currentQ.isNumber && (isNaN(parseInt(normalizedInput)) || parseInt(normalizedInput) <= 0)) {
                alert('Please enter a valid positive number.');
                return;
            }
            const value = currentQ.isNumber ? parseInt(normalizedInput) : (currentQ.key == 'name' ? input.split(" ")[0] : normalizedInput);
            state.data[currentQ.key] = value;

            state.index++;

            if (state.index >= questions.length) {
                askFollowUps();
            } else {
                showQuestion();
            }
        }

        document.getElementById('userInput').addEventListener('keypress', function(event) {
            if (event.key == 'Enter') {
                event.preventDefault();
                submitAnswer();
            }
        });

        function startVoiceInput() {
            if (!('webkitSpeechRecognition' in window)) {
                alert('Speech recognition is not supported in this browser.');
                return;
            }

            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.start();

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                document.getElementById('userInput').value = transcript;
                submitAnswer();
            };

            recognition.onerror = function(event) {
                alert('Error occurred in speech recognition: ' + event.error);
            };
        }

        // askFollowUps() function remains unchanged...
        // [truncated here for brevity – the function content remains the same as before]

        function askFollowUps() {
            const name = state.data.name.split(" ")[0];
            const symptom = state.data.symptom;

            function ask(msg, valid, cb) {
                document.getElementById('question').innerText = msg;
                document.getElementById('userInput').value = '';
                document.getElementById('userInput').focus();

                function handleInput() {
                    const input = document.getElementById('userInput').value.trim().toLowerCase();
                    if (!valid.includes(input)) {
                        alert('Please enter: ' + valid.join(' / '));
                        return;
                    }
                    cb(input);
                }

                document.querySelector('button[onclick="submitAnswer()"]')
                    .onclick = handleInput;

                document.getElementById('userInput').onkeypress = function(event) {
                    if (event.key == 'Enter') {
                        event.preventDefault();
                        handleInput();
                    }
                };
            }

            function done() {
                document.getElementById('question-container').style.display = 'none';
                document.getElementById('result').innerText = state.result;
            }

            if (state.data.sick == 'yes') {
                if (symptom == 'fever') {
                    ask("Did you travel overseas recently? (yes/no)", ['yes','no'], (overseas) => {
                        if (overseas == 'yes') {
                            ask("Were you quarantined after returning? (yes/no)", ['yes','no'], (quarantine) => {
                                if (quarantine == 'yes') {
                                    state.result = `Hey ${name}, no need to worry! Take proper rest and medicines.`;
                                } else {
                                    state.result = `${name}, please consult a COVID health center for a check-up.`;
                                }
                                done();
                            });
                        } else {
                            ask("Were you in contact with a COVID patient? (yes/no)", ['yes','no'], (contact) => {
                                if (contact == 'yes') {
                                    state.result = `${name}, please consult a COVID health center for a check-up.`;
                                } else {
                                    state.result = `Hey ${name}, no need to worry! Take proper rest and medicines.`;
                                }
                                done();
                            });
                        }
                    });
                } else if (symptom == 'cold') {
                    ask("Did you travel overseas recently? (yes/no)", ['yes','no'], (overseas) => {
                        if (overseas == 'yes') {
                            state.result = `${name}, please get checked at a COVID health center and take rest.`;
                            done();
                        } else {
                            ask("Are you feeling only cold? (yes/no)", ['yes','no'], (onlyCold) => {
                                if (onlyCold == 'yes') {
                                    state.result = `${name}, consult a doctor nearby and take medicine.`;
                                    done();
                                } else {
                                    ask("Were you in contact with a COVID patient? (yes/no)", ['yes','no'], (contact) => {
                                        if (contact == 'yes') {
                                            state.result = `${name}, please consult a COVID health center for a check-up.`;
                                        } else {
                                            state.result = `Hey ${name}, no need to worry! Take proper rest and medicines.`;
                                        }
                                        done();
                                    });
                                }
                            });
                        }
                    });
                } else if (symptom == 'yes') {
                    ask("Are you feeling fever? (yes/no)", ['yes','no'], (hasFever) => {
                        if (hasFever == 'yes') {
                            state.data.symptom = 'fever';
                            askFollowUps();
                        } else {
                            ask("Are you feeling cold? (yes/no)", ['yes','no'], (hasCold) => {
                                if (hasCold == 'yes') {
                                    state.data.symptom = 'cold';
                                    askFollowUps();
                                } else {
                                    state.result = `Great! Enjoy your health ${name}, you don't need to worry.`;
                                    done();
                                }
                            });
                        }
                    });
                } else {
                    ask("Are you feeling headache? (yes/no)", ['yes','no'], (headache) => {
                        if (headache == 'yes') {
                            ask("Did you travel overseas in the last 2 weeks? (yes/no)", ['yes','no'], (travel) => {
                                if (travel == 'yes') {
                                    ask("Were you quarantined after returning? (yes/no)", ['yes','no'], (quarantine) => {
                                        if (quarantine == 'yes') {
                                            state.result = `Hey ${name}, no need to worry! Rest and take medicines.`;
                                        } else {
                                            state.result = `${name}, please consult a COVID health center for a check-up.`;
                                        }
                                        done();
                                    });
                                } else {
                                    state.result = `${name}, don't worry. Just visit a doctor and take medicine.`;
                                    done();
                                }
                            });
                        } else {
                            state.result = `Very good! Stay healthy ${name}. Thanks for using the service!`;
                            done();
                        }
                    });
                }
            } else {
                state.result = `Very good! Stay healthy ${name}. Thanks for using the service!`;
                done();
            }
        }
   
var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var request = require('request');
const stripHtml = require("string-strip-html");
var dateFormat = require('dateformat');
const mainJson = require('./apl/main.json');
const dataJson = require('./apl/data.json');
// const studentCategoriesAPI = 'http://54.174.19.182:8081/students/getStudentDetails';
const googleAPIKey = process.env.googleAPIKey;
const stringSimilarity = require('string-similarity');
const {removeStopwords} = require('stopword');



module.exports = {
    getColumn: "Answer",
    dayNames: {0:'Sunday',1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday',6:'Saturday'},
    StaticTable: 'AskGVSUStatic',
    DynamicTable: 'AskGVSUDynamic',
    // PVAMUDepartmentMaster:'AskPVAMUDeptMaster',
    
    defaultImage: 'https://gvsu-skill.s3.amazonaws.com/logo.png',      //change

    remindersArray: [
        'Thank you for using LakerBuddy virtual assistant!, don\'t forget to ask about University Counseling Services next time.',
        'Thank you for using LakerBuddy virtual assistant!, don\'t forget to ask about Financial Aid next time.',
        'Thank you for using LakerBuddy virtual assistant!, don\'t forget to ask about Housing next time.',
        'Thank you for using LakerBuddy virtual assistant!, don\'t forget to ask about Registrar next time.',
        'Thank you for using LakerBuddy virtual assistant!, don\'t forget to ask about Information Technology Services next time.'
    ],

    daysArray: ['','monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
    noInformation: 'Sorry I could not find any information. Please contact administrator',
    repromptSpeechText: 'What else would you like to know?',
    noValueReturned: "Sorry I couldn't find any information on that or maybe I misunderstood you. Please try again.",
    listenspeech: 'Is there anything else I can help you with?',
	helpspeech: 'Welcome back Philly! LakerBuddy is designed to answer your university questions on some topics like Financial Aid, Housing, Registrar and so on, e.g. You can ask by saying where is registrar located. What would you like to know?',
    YesPrompt: ' What would you like to know?',
    needtoLinkYourAccount: 'To access this service you need to link your account with Alexa.',
    optOutCategory: 'You have opted out of this category of questions.',
    // welcomeMessage: 'Welcome back Philly! LakerBuddy is designed to answer many university questions on topics like Financial Aid, Housing, Registrar, etc.; For example, you can ask where is the registrar located. I can also answer several personalised questions.\n What would you like to know?',
    welcomeMessage: "myLaker is designed to answer your university questions on some topics like Financial Aid, Housing, Registrar and so on, e.g. You can ask by saying where is registrar located. What would you like to know?",
    signUpMessage: 'You have not registered with GVSU portal, Please sign up',
    semilinkWelcomeMessage: "Welcome to the myLaker Skill. ",
	

    stripSpeakOptions: {
        ignoreTags: ['amazon:effect', 'audio', 'break', 'emphasis', 'p', 'phoneme', 'prosody', 's', 'say-as', 'speak', 'sub', 'w'],
        stripTogetherWithTheirContents: ["script", "style", "xml"],
        skipHtmlDecoding: false,
        returnRangesOnly: false,
        trimOnlySpaces: false,
        dumpLinkHrefsNearby: false
    },

    stripCardOptions: {
        ignoreTags: [],
        stripTogetherWithTheirContents: ["script", "style", "xml"],
        skipHtmlDecoding: false,
        returnRangesOnly: false,
        trimOnlySpaces: false,
        dumpLinkHrefsNearby: false
    },

    checkVideoSupport: function(handlerInput) {
        if(typeof handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display !== "undefined") {
            return true;
        } else {
            return false;
        }
    },

    setDynamoParams: async function(handlerInput) {
        var intentName = handlerInput.requestEnvelope.request.intent.name;
        var slot = this.getSlotValue(handlerInput);
        console.log('slot', slot);
        if(slot !== null) {
            if (slot === 'staticNoSlot') {
                var params = {
                    TableName: this.StaticTable,
                    FilterExpression: "#title = :title_val",
                    ExpressionAttributeNames: {
                        "#title": 'IntentName',
                    },
                    ExpressionAttributeValues: { ":title_val": intentName }
                };
            } else {
                slot = slot.toLowerCase().replace(/[^A-Z0-9]+/ig, "");
                var params = {
                    TableName: this.StaticTable,
                    FilterExpression: "#title = :title_val AND #slot = :slot_val",
                    ExpressionAttributeNames: {
                        "#title": 'IntentName',
                        "#slot": 'Slot'
                    },
                    ExpressionAttributeValues: { ":title_val": intentName, ":slot_val": slot }
                };
            }
        } else {
            //emit to unhandle
            const unhandled = require('./areas/unhandled');
            return unhandled.handle(handlerInput);
        }
        

        var obj = await this.scanDynamoItem(params);
        return this.formSpeech(handlerInput, obj);
    },

    scanDynamoItem: function(params) {
        return new Promise((resolve, reject) => {
            var docClient = new AWS.DynamoDB.DocumentClient();
            docClient.scan(params, (err, data) => {
                console.log("Dynamo Scan params ==>", params, "<==> results ==>", data);
                var obj = null;
                obj = {
                    speechText: this.noValueReturned,
                    displayText: this.noValueReturned,
                    repromptSpeechText: this.listenspeech
                }
                if (err) {
                    console.error("Dynamo Scan Error ==>", JSON.stringify(err));
                } else {
                    var speechText = '';
                    if (data.Items.length !== 0) {
                        console.log("count of items:", data.Items.length);
                        data.Items.forEach(function (itemdata) {
                            speechText = speechText + itemdata.Answer;
                        });
                        console.log("Dynamo Scan Result", speechText);
                        obj = {
                            speechText: speechText + ' What else would you like to know?',
                            displayText: speechText + ' What else would you like to know?',
                            repromptSpeechText: this.listenspeech
                        }
                    }
                    resolve(obj);
                }                
            });
        });
    },

    formSpeech: function(handlerInput, obj = {}) {
        console.log('formSpeech::::', obj);
        var displaySupport = this.checkVideoSupport(handlerInput);
        var handler = handlerInput.responseBuilder;

        // if (obj.needtoAccountLinking !== undefined) {
        //     if (obj.needtoAccountLinking === true) {
        //         handler.withLinkAccountCard();
        //     }
        // } else {
            if (obj.displayText !== undefined && displaySupport === true) {
                obj.displayText = obj.displayText.replace(/<(?:.|\n)*?>/gm, '');
                handler.addDirective({
                        type: 'Alexa.Presentation.APL.RenderDocument',
                        version: '1.0',
                        document: mainJson,
                        datasources: this.setTemplateBody(obj.displayText)
                });
            } else if(obj.displayText !== undefined) {
                obj.displayText = obj.displayText.replace(/<(?:.|\n)*?>/gm, '');
                handler.withStandardCard('GVSU', obj.displayText, this.defaultImage, this.defaultImage);
            }
        // }

        if (obj.displayStandardCardText !== undefined) {
            handler.withStandardCard('GVSU', obj.displayStandardCardText.replace(/<(?:.|\n)*?>/gm, ''), this.defaultImage, this.defaultImage);
        }
        
        if (obj.speechText !== undefined && obj.speechText !== null) {
            obj.speechText = obj.speechText.replace('&', 'and').replace(/\s+&\s+/g, ' and ');
            console.log('speechtext in function modified::', obj.speechText, typeof obj.speechText);
            handler.speak(obj.speechText);
        }
        if (obj.repromptSpeechText !== undefined && obj.repromptSpeechText !== null) {
            console.log('repromptSpeechText::', obj.repromptSpeechText, typeof obj.repromptSpeechText);
            obj.repromptSpeechText = obj.repromptSpeechText.replace('&', 'and').replace(/\s+&\s+/g, ' and ');
            handler.reprompt(obj.repromptSpeechText);
        }

        if (obj.addConfirmIntentDirective !== undefined && obj.addConfirmIntentDirective !== null) {
            console.log('addConfirmIntentDirective', obj.addConfirmIntentDirective);
            handler.addConfirmIntentDirective({
                name: obj.addConfirmIntentDirective,
                confirmationStatus: 'CONFIRMED',
                slots: obj.slots
            })
        }

        if (obj.addElicitSlotDirective !== undefined && obj.addElicitSlotDirective !== null) {
            console.log('addElicitSlotDirective', obj.addElicitSlotDirective);
            handler.addElicitSlotDirective(obj.addElicitSlotDirective);
        }

        if (obj.addDelegateDirective !== undefined && obj.addDelegateDirective !== null) {
            console.log('addDelegateDirective', obj.addDelegateDirective);
            handler.addDelegateDirective({
                name: obj.addDelegateDirective,
                slots: obj.slots
            })
        }
        // if (handler.requestEnvelope !== undefined) {
        //     if (handler.requestEnvelope.session.new == true && handler.requestEnvelope.request.type == "IntentRequest") {
        //         handler.withShouldEndSession(true);
        //     } else {
        //         handler.withShouldEndSession(false);
        //     }
        // }
        if (obj.sessionEnd !== undefined && obj.sessionEnd === true) {
            console.log('end session id true');
            handler.withShouldEndSession(true);
        }

        if (obj.sessionEnd !== undefined && obj.sessionEnd === false) {
            console.log('end session id false');
            handler.withShouldEndSession(false);
        }
        
        //required for repeat intent
        if (obj.speechText !== undefined && obj.speechText !== null ){
                const attributes = handlerInput.attributesManager.getSessionAttributes();
                attributes.lastSpeechText = obj.speechText;
                handlerInput.attributesManager.setSessionAttributes(attributes);
                //lastSpeechText = obj.speechText;
                console.log('last speech obj', attributes.lastSpeechText);
        }

        // console.log('Ended Response time at', new Date());
        return handler.getResponse();
    },    
//for reminder other events after exit
    prependReminders: function(message,reminders) {
        if (reminders.length != 0){
            var item = reminders[Math.floor(Math.random() * reminders.length)];
            return item + " " + message;
        }else{
            return message;
        }
    },
//for displaying image and content in device
    setTemplateBody: function(rawText, images = null) {
        var data = dataJson;
        rawText = rawText.replace(/&/g, " and ");
        rawText = rawText.replace(/quot;/g, " ");
        rawText = stripHtml(rawText, this.stripCardOptions);
        data.bodyTemplate3Data.textContent.primaryText.text = rawText;
        if (images === null) {
            data.bodyTemplate3Data.image.sources[0].url = this.defaultImage;
            data.bodyTemplate3Data.image.sources[1].url = this.defaultImage;
        }
        // console.log('setTemplateBody::data::::', JSON.stringify(data));
        return data;
    },

    getSlotValue: function(handlerInput) {
        if (handlerInput.requestEnvelope.request.intent.slots !== undefined) {
            console.log('slottt', JSON.stringify(handlerInput.requestEnvelope.request.intent.slots));
            var slotKeys = Object.keys(handlerInput.requestEnvelope.request.intent.slots);
            var slotObj = slotKeys.filter(item => {
                return handlerInput.requestEnvelope.request.intent.slots[item].resolutions !== undefined;
            });
            console.log('slotObj ::::: ', slotObj);
            // if (slotObj) {
            //     slotObj = slotObj[0];
            // }
            if (slotObj !== undefined) {
                var slotValue = handlerInput.requestEnvelope.request.intent.slots[slotObj].resolutions.resolutionsPerAuthority[0].values[0].value.name.toLowerCase();    
            } else {
                var slotValue = null;                
            }
        } else {
            var intentName = handlerInput.requestEnvelope.request.intent.name;
            console.log('slot undefined', intentName);
            var slotValue = 'staticNoSlot';
        }
        console.log('getSloValue::slotValue', slotValue);
        return slotValue;
    },

    
    queryScan: function (params) {
        return new Promise((resolve, reject) => {
            var docClient = new AWS.DynamoDB.DocumentClient();
            docClient.query(params, onScan);
            function onScan(err, data) {
                if (err) {
                    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                    resolve(null);
                } else {
                    console.log("Query Scan succeeded." + JSON.stringify(data));
                    if (data.Items.length > 0) {
                        var itemdataFinal = data.Items[0];
                    } else {
                        var itemdataFinal = null;
                    }
                    resolve(itemdataFinal);
                }
            }
        });
    },

    slotForAllWhatIs: function(handlerInput, slotName = null) {
        console.log('slotForAllWhatIs', slotName);
        return this.searchQuery(slotName,handlerInput).then((ans) => {
            var obj = null;
            if (ans === null) {
                obj = {
                    speechText: this.noValueReturned,
                    displayText: this.noValueReturned,
                    repromptSpeechText: this.listenspeech
                }
            } else {
                obj = {
                    speechText: ans + ' What else would you like to know?',
                    displayText: ans + ' What else would you like to know?',
                    repromptSpeechText: this.listenspeech
                }
            }
            return this.formSpeech(handlerInput, obj);
        });
        
    },

    searchQuery: function(slotName = null,handlerInput) {
        console.log("intent name in search query::",handlerInput.requestEnvelope.request.intent);
        return new Promise((resolve, reject) => {
			var params = {
				TableName: this.StaticTable,
				FilterExpression: "#title = :title_val",
				ExpressionAttributeNames: {
					  "#title": 'IntentName',
				},
				ExpressionAttributeValues: { ":title_val": handlerInput.requestEnvelope.request.intent.name}
            }
            
            console.log('searchQuery', params);

			// Scan DynamoDB
			var docClient = new AWS.DynamoDB.DocumentClient();
			docClient.scan(params, (err, data) => {
				if(err) {
                    console.log('stringSimilarityfn err =>' + JSON.stringify(err))
                    resolve(null);                    
				}
                var slots = [];
                
				if(data) {
                    console.log('data.Items', data.Items);
					data.Items.forEach(function(itemdata) {
                        // console.log("itemslot",itemdata.Slot.values);
                        //console.log("itemslot",JSON.stringify(itemdata.Slot.values));
                        const arraySlot = itemdata.Slot.values;
                        //console.log('array slottt', arraySlot);
                        if (arraySlot.length !== 0) {
                            arraySlot.forEach(std => {
                                if (std.trim() !== '') {
                                    slots.push(std);
                                }
                            })
                        }
					});
                    if (slots.length === 0) {
                        resolve(null);
                    }
                    // Levenstein best match result
                    console.log('slotname=====>', slotName);
                    console.log('slots arrayyy', slots);
					var matches = stringSimilarity.findBestMatch(slotName, slots);
					console.log('stringSimilarityfn best match slot ==> ' + slotName + '====with dynamodb slots ==>' + JSON.stringify(slots) + ' result ==> ' + JSON.stringify(matches));
                    if (matches.bestMatch.rating < 0.5) {
                        resolve(null);
                    } else {
                        var bestMatched = data.Items.filter(item => {
                            return item.Slot.values.includes(matches.bestMatch.target)
                        });
                        console.log('stringSimilarityfn best match answer ======', bestMatched[0].Answer);
                        resolve(bestMatched[0].Answer);
                    }
				}
			});
		});
    },

    DynamoDBScan: function(slot = null, intentName = null, tableName = null) {
        console.log('slot = ', slot, ',intentName = ', intentName, ',tableName = ', tableName);
        return new Promise((resolve, reject) => {
            var params = {
                TableName: tableName,
				FilterExpression: "#title = :title_val",
				ExpressionAttributeNames: {
					  "#title": 'IntentName',
				},
				ExpressionAttributeValues: { ":title_val": intentName }
            };
            if (slot !== null) {
                console.log("slotarray::",slot);
                let FilterExpression = 'IntentName = :IntentName';
                let ExpressionAttributeValues = {':IntentName': 'OpenCloseTime'};
                slots.forEach((slot, i) => {
                    if (slot) {
                        FilterExpression = FilterExpression + ' AND contains(Slot,:Slot'+i+')';
                        ExpressionAttributeValues[':Slot'+i] = slot
                    }
                });
                var params = {
                    TableName: tableName, 
                    FilterExpression: FilterExpression, 
                    ExpressionAttributeValues: ExpressionAttributeValues
                };
                // params = {
                //     TableName: tableName,
                //     FilterExpression: "#slot = :slotval and #intent = :intentval",
                //     ExpressionAttributeNames: {
                //         "#slot": "Slot",
                //         "#intent":"IntentName"
                //     },
                //     ExpressionAttributeValues: { ":slotval": slot ,":intentval":intentName}
                // };
            }
            
			// Scan DynamoDB
			var docClient = new AWS.DynamoDB.DocumentClient();
			docClient.scan(params, (err, data) => {
				if(err) {
                    console.log('dynamodb scan err =>' + JSON.stringify(err))
                    resolve(null);                    
                }
                console.log('dynamodb scan res =>' + JSON.stringify(data))                
				if(data && data.Items.length > 0) {
                    resolve(data.Items[0]);
				} else {
                    resolve(null);
                }
			});
        });
    },

    dynamicDynamoScan: function(params = null) {
        return new Promise((resolve, reject) => {
            if (params !== null) {
                var docClient = new AWS.DynamoDB.DocumentClient();
                docClient.scan(params, onScan);
                function onScan(err, data) {
                    console.log("Dynamo Scan params ==>", params, "error", err, "<==> results ==>", data);
                    if (err) {
                        resolve(null);
                    } else {
                        if (typeof data.Items[0] === undefined ) {
                            // continue scanning if we have more items
                            if (typeof data.LastEvaluatedKey !== "undefined") {
                                console.log("Scanning for more...");
                                params.ExclusiveStartKey = data.LastEvaluatedKey;
                                docClient.scan(params, onScan);
                            } else {
                                resolve(null);
                            }
                        } else {
                            resolve(data.Items[0]);
                        }
                    }
                }
            } else {
                resolve(null);
            }
        });
    },

    

    scanSportingEventItem: function(slot, params) {
        return new Promise((resolve, reject) => {
            var docClient = new AWS.DynamoDB.DocumentClient();    
            docClient.scan(params, (err, data) => {
                console.log("within   docclient.scan param object ======" , params);
                console.log("within   docclient.scan data object ======" , data);
                if (err) {
                    //console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                    console.log("scanSportingEventItem  within error block docclient.scan======");
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err));
                    var speechText = '';
                    speechText = this.noValueReturned;
                } else {
                    var speechText = '';
                    var eventList = [];
                    if (data.Items.length == 0) {
                        speechText = this.noValueReturned;
                    }
                    else {
                        console.log("count of items:", data.Items.length);
                        var dataList = data.Items;
        
                        //filter data list
                        for (i = 0; i < data.Items.length; i++) {
                            //============== date logic current date in USA newyork time zone
                            var currentdate = new Date();
                            console.log("sportingevent currentdate =======" + currentdate);
                            var localoffset = currentdate.getTimezoneOffset() * 60000;
                            //console.log("sportingevent localoffset =======" + localoffset);
                            var localtime = currentdate.getTime();
                            //console.log("sportingevent localtime =======" + localtime);
                            var utc = localtime + localoffset;
                            //console.log("sportingevent utc =======" + utc);
                            var offset = -4;
                            var ustime = utc + (3600000 * offset);
                            //var currentdateinUSformat = currentdate.setTimeZone(TimeZone.getTimeZone("UTC-5"));
                            //console.log("sportingevent ustime =======" + ustime);
                            var usdate = new Date(ustime);
                            //console.log("sportingevent usdate =======" + usdate);
                            var y1 = usdate.getFullYear();
                            var m1 = usdate.getMonth() + 1;
                            //console.log("m1=====" + m1);
                            var d1 = usdate.getDate();
                            // date logic for slot date
                            var slotdate = new Date(dataList[i].Slot);
                            //console.log("sportingevent slotdate =======" + slotdate);
                            var y2 = slotdate.getFullYear();
                            var m2 = slotdate.getMonth() + 1;
                            //console.log("m2=====" + m2);
                            var d2 = slotdate.getDate();
                            //var currentdateinUSformat = currentdate.setTimeZone(TimeZone.getTimeZone("UTC-5"));
                            //console.log("sportingevent usdate1 =======" + slotdate);
                            if (y2 > y1) {
                                eventList.push(dataList[i]);
                            }
                            else if (y2 == y1) {
                                if (m2 > m1) {
                                    eventList.push(dataList[i]);
                                }
                                else if (m2 == m1) {
                                    if (d2 > d1 || d2 == d1) {
                                        eventList.push(dataList[i]);
                                    }
                                }
                            }
                        }
                        if (eventList != null) {
                            /* sort function to get latest and next dates */
                            eventList.sort(function (a, b) {
                                var dateA = new Date(a.Slot), dateB = new Date(b.Slot);
                                return dateA - dateB;
                            });
                        }
                    }
                    //console.log("scanSportingEventItem Scan succeeded after." + JSON.stringify(eventList[0]));
        
                    if (typeof eventList[0] != 'undefined' && eventList[0] != null) {
                        var datestr = JSON.stringify(eventList[0].Slot);
                        var modifieddate = dateFormat(datestr, "fullDate");
                        speechText = eventList[0].EventTitle + " is on " +eventList[0].EventDateTime+" at "+eventList[0].SportsEventLocation+ ". ";
                        //speechText = speechText + " is on " + modifieddate + ". ";
                    }
                    else if (typeof eventList[0] == 'undefined' || eventList[0] == null) {
                        console.log("Event: I am inside last else block printing " + slot);
                        speechText = "There are no upcoming events for "+ slot+". ";
        
                    }

                    speechText = speechText.charAt(0).toUpperCase() + speechText.slice(1);
        
                    console.log("speech text after loop:", speechText);
                }
                resolve(speechText);
            });
        });
    },

    // fnGetPVAMUEvents: function(handlerInput, intentName = null, slot = null) {
    //     if (typeof slot != 'undefined' && slot != null) {
    //         var eventparams = {
    //             TableName: this.PVAMUDynamicTable,
    //             FilterExpression: "#slot = :slotval and #intent = :intentval",
    //             ExpressionAttributeNames: {
    //                 "#slot": "Slot",
    //                 "#intent":"IntentName"
    //             },
    //             ExpressionAttributeValues: { ":slotval": slot ,":intentval":intentName}					
    //         };

    //         return this.getPVAMUDataEvent(eventparams, slot).then((obj) => {
    //             return this.formSpeech(handlerInput, obj);
    //         })

    //     } else {
    //         var currentTime = new Date(new Date().toLocaleDateString('en-US', {hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago'})).getTime();
    //         var eventparams = {
    //             TableName: this.PVAMUDynamicTable,
    //             FilterExpression: "#SlotInMillis > :SlotInMillisVal and #intent = :intentval",
    //             ExpressionAttributeNames: {
    //                 "#SlotInMillis": "SlotInMillis",
    //                 "#intent":"IntentName"
    //             },
    //             ExpressionAttributeValues: { ":SlotInMillisVal": currentTime ,":intentval":intentName}					
    //         };
    //         return this.getPVAMUDataEvent(eventparams, slot).then((obj) => {
    //             return this.formSpeech(handlerInput, obj);
    //         })
    //     }
    // },

    // getPVAMUDataEvent: function(eventparams, slot) {
    //     return new Promise((resolve, reject) => {
    //         var docClient = new AWS.DynamoDB.DocumentClient();
    //         var dataText = [];
    //         var obj = null;
    //         var ch = this;
    //         docClient.scan(eventparams, (err, data) => {
    //             console.log("within scanFiterDynamoItem docclient.scan param object ======", eventparams, "data", data);
        
    //             if (err) {
    //                 console.error("Unable to read item. Error JSON:", JSON.stringify(err));
    //                 obj = {
    //                     speechText: 'I can not find any event data. What else would you like to know?',
    //                     displayText: 'I can not find any event data. What else would you like to know?',
    //                     repromptSpeechText: this.listenspeech,
    //                     sessionEnd: false
    //                 }
    //                 resolve (obj);
    //             } else {
    //                if (data.Items.length != 0) {
    //                     console.log("count of items:", data.Items.length);
    //                     data.Items.forEach(function (itemdata) {
    //                         dataText.push(itemdata);
    //                     });
    //                     console.log("dataText::"+JSON.stringify(dataText));
    //                     var titlearr = [];
    //                     var answercount = 0;

    //                     var message = null;
    //                     var maxlength = 0;
    //                     var eventsDataArray = ch.sortEventsByKey(dataText, 'Slot');
    //                     console.log("eventsDataArray::", eventsDataArray);
    //                     message = '';
    //                     // .toLocaleDateString("en-US", options);
                                                 
    //                     var itemsNum = eventsDataArray.length;

    //                     for (var z = 0; z < itemsNum; z++) {
    //                        var answer = eventsDataArray[z].EventTitle + ' on ' + eventsDataArray[z].EventDateTime + (eventsDataArray[z].SportsEventLocation.trim() !== '' ? ' at <say-as interpret-as="address">' + eventsDataArray[z].SportsEventLocation + "</say-as>" : '');
    //                        answercount++;
    //                        titlearr.push(answer.trim());
    //                     }
    //                             if (answercount > 5) {
    //                                 answercount = 5;
    //                                 message = message + "Top five events are: ";
    //                             } else if (answercount == 1){
    //                                 message = message + "The event is: ";
    //                             }
    //                             else {
    //                                 message = message + "The events are: ";
    //                             }
                                
    //                             for (var y = 0; y < answercount; y++) {
    //                                 if (y === answercount - 1 && y !== 0) {
    //                                     message += " And " + titlearr[y] + ". ";
    //                                 } else if (answercount === 1) {
    //                                     message += titlearr[y] + ". ";
    //                                 } else {
    //                                     message += titlearr[y] + ", ";
    //                                 }
    //                             }

    //                             var sanatizeSSMLMessage =  message.replace(/&/g, " and ");
    //                             //sanatizeSSMLMessage =  sanatizeSSMLMessage.replace(/quot;/g, " ");
                                
    //                             console.log(sanatizeSSMLMessage);
    //                             obj = {
    //                                 speechText: sanatizeSSMLMessage + ' What else would you like to know?',
    //                                 displayText: sanatizeSSMLMessage + ' What else would you like to know?',
    //                                 repromptSpeechText: ch.listenspeech,
    //                                 sessionEnd: false
    //                             }
    //                 } else {
    //                             obj = {
    //                                 speechText: 'There are no events on campus. What else would you like to know?',
    //                                 displayText: 'There are no events on campus. What else would you like to know?',
    //                                 repromptSpeechText: ch.listenspeech,
    //                                 sessionEnd: false
    //                             }
    //                 }
    //                 resolve (obj);
    //             }
                           
    //             });
    //         });  
    // },

    sortEventsByKey: function(array, key) {
        console.log("array::", JSON.stringify(array));
        console.log("key::"+key);
        return array.sort(function (a, b) {
            var x = a[key]; var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    },


    getDialogSlotValue: function(slotParam) {
        if (slotParam.value) {
            if (slotParam.resolutions.resolutionsPerAuthority[0].values) {
                return slotParam.resolutions.resolutionsPerAuthority[0].values[0].value.name;
            } else {
                return slotParam.value;
            }
        } else {
            return null;
        }
    },

    fnDynamoScan: function(params, scanType) {
        return new Promise((resolve, reject) => {
            var docClient = new AWS.DynamoDB.DocumentClient();
            if (scanType === 'scan') {
                docClient.scan(params, onScan);            
            } else if (scanType === 'query') {
                docClient.query(params, onScan);
            }
            function onScan(err, data) {
                if (err) {
                    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                    resolve(null);
                } else {
                    console.log("Query Scan succeeded." + JSON.stringify(data));
                    if (scanType === 'scan') {
                        if (typeof data.LastEvaluatedKey != "undefined") {
                            console.log("Scanning for more...");
                            params.ExclusiveStartKey = data.LastEvaluatedKey;
                            docClient.scan(params, onScan);
                        }
                    }
                    resolve(data.Items);
                }
            }
        });
    },

    suggestionsFromJson : function(params) {
        // console.log('suggestionsFromJson', JSON.stringify(params));
        let slot = params.slot;
        let shuffle = params.shuffle;
        let utterance = params.utterance;
        let intent = params.intent;
        return new Promise((resolve, reject) => {
            request(process.env.suggestionJsonURL, function(error, response, body){
                if (error) {
                    console.log('suggestion request', error);
                    resolve(null);
                }
                // console.log('suggestionJSON', typeof body, body);
                let suggestions = JSON.parse(body).suggestions;
                if (slot) {
                    
                    let suggestedSlotObj = [];
                    suggestions.forEach(obj => {
                        // console.log('slot :::::::: ', (obj.slotname && obj.intent === intent));
                        if (obj.slotname && obj.intent === intent) {
                            // console.log('suggestions :::::::: ', suggestions, 'slot :: ',slot)
                            let slotArr = obj.slotname.map(k => k.replace(/[^A-Z0-9]+/ig,'').toLowerCase());
    
                            
    
                            console.log('slotArr', slotArr);
                            console.log('test ::: ',slot.replace(/[^A-Z0-9]+/ig,''));
                            if (slotArr.includes(slot.toLowerCase().replace(/[^A-Z0-9]+/ig,''))) {
                                console.log('slotArr', slotArr);
                                let slottarr = obj.slotname.filter((k) => {
                                    if (k.replace(/[^A-Z0-9]+/ig,'').toLowerCase() !== slot.replace(/[^A-Z0-9]+/ig,'').toLowerCase()) {
                                        console.log('k ==== ', k);
                                        return k;
                                    }
                                })
                                suggestedSlotObj = [...suggestedSlotObj,...slottarr];
                            //     // let returnSlots = slotArr.filter((k) => {
                            //     //     if (k !== slot.replace(/[^A-Z0-9]+/ig,'')) {
                            //     //         return k;
                            //     //     }
                            //     // });
    
                            //     let slotPos = slotArr.indexOf(slot.replace(/[^A-Z0-9]+/ig,''));
                            //     let returnSlots = obj.slotname.splice(slotPos, 1);
    
    
                            //     // let returnSlots = obj.slotname.splice(indexSlotPos, 1);
                            //     // console.log(returnSlots, indexSlotPos);
                            //     suggestedSlotObj = [...suggestedSlotObj,...returnSlots];
                            }
                        }
                    });
                    console.log('suggestedSlotObj ::: ', suggestedSlotObj, ' :: length :: ',suggestedSlotObj.length)
                    if (suggestedSlotObj.length > 2 && shuffle) {
                        suggestedSlotObj = suggestedSlotObj.sort(function() {return 0.5 - Math.random()})
                    }
                    console.log('suggested slots are::', suggestedSlotObj);
                    resolve(suggestedSlotObj);
                } else if (utterance) {
                    let jsonutterances = suggestions.map(a => a.uttr.replace(/[^A-Za-z0-9\s]/gm, ''));
                    // console.log('jsonutterances', jsonutterances);
                    let filteredStopWordQueryText = utterance.replace(/[^A-Za-z0-9\s]/gm, '');
                    // let filteredStopWordQueryText = removeStopwords(utterance.split(' ')).join(' ');
                    // console.log('filteredStopWordQueryText');
                    let filteredSuggestions = stringSimilarity.findBestMatch(filteredStopWordQueryText, jsonutterances);
                    filteredSuggestions = filteredSuggestions.ratings.sort((a,b) => b.rating - a.rating);
                    console.log('filteredSuggestions', JSON.stringify(filteredSuggestions.slice(0,3)));
                    filteredSuggestions = filteredSuggestions.map(a => a.target);
                    let finalSugg = [];
                    filteredSuggestions.forEach(sug => {
                        if (matchSug = suggestions.find(k => k.uttr.replace(/[^A-Za-z0-9\s]/gm, '') === sug)) {
                            finalSugg.push(matchSug.uttr);
                        }
                    })
                    // let formattedFilteredSugg = suggestions.filter(k => k.uttr.replace(/[^A-Za-z0-9]/gm, ''));
                    // formattedFilteredSugg = formattedFilteredSugg.map(k => k.uttr);
                    // console.log('formattedFilteredSugg', finalSugg);
                    resolve(finalSugg);
                }
                resolve(null);
            });
        });
    },  
    
    contactInfodynamodbScan : function(params) {
        console.log('DynamoDB Scan Params::', JSON.stringify(params));
        return new Promise((res, rej) => {
            var docClient = new AWS.DynamoDB.DocumentClient();
            docClient.scan(params, onScan);
            function onScan(err, data) {
                if (err) {
                    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                    res(null);
                } else {
                    console.log("Scan succeeded." + JSON.stringify(data));
                    var itemdataFinal = null;
                    // continue scanning if we have more items
                    if (typeof data.LastEvaluatedKey != "undefined" && data.Count === 0) {
                        console.log("Scanning for more...");
                        params.ExclusiveStartKey = data.LastEvaluatedKey;
                        docClient.scan(params, onScan);
                    } else {
                        // console.log('Returned selected scanned data', data.Items);
                        res(data.Items);
                    }
                }
            }
        });
    },

    // for real time demo =============================== 
    slotForRealTime: function(handlerInput, slotName = null) {
        console.log('slotForRealTime :: ', slotName);
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const ignoredArr = ['MyAdvisors', 'GeneralInstructorReal'];
        if(slotName !== null) {
            if (slotName === 'staticNoSlot') {
                var params = {
                    TableName: this.DynamicTable,
                    FilterExpression: "#title = :title_val",
                    ExpressionAttributeNames: {
                        "#title": 'IntentName',
                    },
                    ExpressionAttributeValues: { ":title_val": intentName }
                };
            } else {
                return this.searchQueryRealTime(slotName,handlerInput).then((ans) => {
                    var obj = null;
                    if (ans === null) {
                        obj = {
                            speechText: this.noValueReturned,
                            displayText: this.noValueReturned,
                            repromptSpeechText: this.listenspeech
                        }
                    } else {
                        obj = {};
                        if (ignoredArr.includes(intentName)) {
                            obj['speechText'] = ans;
                            obj['displayStandardCardText'] = ans;
                            obj['addConfirmIntentDirective'] = intentName;
                            obj['slots'] = handlerInput.requestEnvelope.request.intent.slots;

                        } else {
                            obj['speechText'] = ans + ' What else would you like to know?';
                            obj['displayText'] = ans + ' What else would you like to know?';
                            obj['repromptSpeechText'] = this.listenspeech;
                        }
                    }

                    //reset the flag
                    // if(handlerInput.requestEnvelope.request.intent.name == 'GeneralInstructorContactInfoReal'){
                    //     obj['flagForstatus'] = false;
                    //     flagForstatus = false;
                    //     console.log('searchQueryRealTime flagForstatus', flagForstatus, ' === ', obj['flagForstatus']);
                    //     // return this.formSpeech(handlerInput, obj, flagForstatus);
                    // }
                    // console.log('searchQueryRealTime flagForstatus', flagForstatus, ' === ', obj['flagForstatus']);
                    return this.formSpeech(handlerInput, obj);
                });
            }
        } else {
            //emit to unhandle
            const unhandled = require('./areas/unhandled');
            return unhandled.handle(handlerInput);
        }

        
        
    },

    searchQueryRealTime: function(slotName = null,handlerInput) {
        console.log("intent name in search query::",handlerInput.requestEnvelope.request.intent);
        return new Promise((resolve, reject) => {
			var params = {
				TableName: this.DynamicTable,
				FilterExpression: "#title = :title_val",
				ExpressionAttributeNames: {
					  "#title": 'IntentName',
				},
				ExpressionAttributeValues: { ":title_val": handlerInput.requestEnvelope.request.intent.name}
            }
            
            console.log('searchQueryRealTime', params);

			// Scan DynamoDB
			var docClient = new AWS.DynamoDB.DocumentClient();
			docClient.scan(params, (err, data) => {
				if(err) {
                    console.log('stringSimilarityfn err =>' + JSON.stringify(err))
                    resolve(null);                    
				}
                var slots = [];
                
				if(data) {
                    console.log('data.Items', data.Items);
					data.Items.forEach(function(itemdata) {
                        // console.log("itemslot",itemdata.Slot.values);
                        //console.log("itemslot",JSON.stringify(itemdata.Slot.values));
                        const arraySlot = itemdata.Slot.values;
                        //console.log('array slottt', arraySlot);
                        if (arraySlot.length !== 0) {
                            arraySlot.forEach(std => {
                                if (std.trim() !== '') {
                                    slots.push(std);
                                }
                            })
                        }
					});
                    if (slots.length === 0) {
                        resolve(null);
                    }
                    // Levenstein best match result
                    console.log('slotname=====>', slotName);
                    console.log('slots arrayyy', slots);
					var matches = stringSimilarity.findBestMatch(slotName, slots);
					console.log('stringSimilarityfn best match slot ==> ' + slotName + '====with dynamodb slots ==>' + JSON.stringify(slots) + ' result ==> ' + JSON.stringify(matches));
                    if (matches.bestMatch.rating < 0.5) {
                        resolve(null);
                    } else {
                        var bestMatched = data.Items.filter(item => {
                            return item.Slot.values.includes(matches.bestMatch.target)
                        });
                        console.log('stringSimilarityfn best match answer ======', bestMatched[0].Answer);

                        console.log('confirmationStatus ============ ',handlerInput.requestEnvelope.request.intent.confirmationStatus);
                        if (handlerInput.requestEnvelope.request.intent.name == 'GeneralInstructorContactInfoReal' 
                            && slotName == 'history'
                            // && !flagForstatus
                            && handlerInput.requestEnvelope.request.intent.confirmationStatus === 'NONE'
                        ){
                            resolve('Your Writing History professor is Gabriele Gottlieb. ' + bestMatched[0].Answer);
                        }

                        if (handlerInput.requestEnvelope.request.intent.name == 'GeneralInstructorContactInfoReal' 
                            && slotName == 'elementaryalgebra'
                            // && !flagForstatus
                            && handlerInput.requestEnvelope.request.intent.confirmationStatus === 'NONE'
                        ){
                            resolve('Your Elementary Algebra professor is Feryal Alayont. ' + bestMatched[0].Answer);
                        }

                        if (handlerInput.requestEnvelope.request.intent.name == 'GeneralInstructorContactInfoReal' 
                            && slotName == 'physicsforengineering'
                            // && !flagForstatus
                            && handlerInput.requestEnvelope.request.intent.confirmationStatus === 'NONE'
                        ){
                            resolve('Your Physics for Engineering professor is Dr. Keith Oliver.  ' + bestMatched[0].Answer);
                        }
                        // console.log('after ans flagForstatus', flagForstatus);
                        // flagForstatus = false;
                        // console.log('after ans flagForstatus', flagForstatus);
                        resolve(bestMatched[0].Answer);
                    }
				}
			});
		});
    },


    setDynamoParamsReal: async function(handlerInput) {
        var intentName = handlerInput.requestEnvelope.request.intent.name;
        var slot = this.getSlotValue(handlerInput);
        console.log('slot', slot);
        if(slot !== null) {
            if (slot === 'staticNoSlot') {
                var params = {
                    TableName: this.DynamicTable,
                    FilterExpression: "#title = :title_val",
                    ExpressionAttributeNames: {
                        "#title": 'IntentName',
                    },
                    ExpressionAttributeValues: { ":title_val": intentName }
                };
            } else {
                slot = slot.toLowerCase().replace(/[^A-Z0-9]+/ig, "");
                var params = {
                    TableName: this.DynamicTable,
                    FilterExpression: "#title = :title_val AND #slot = :slot_val",
                    ExpressionAttributeNames: {
                        "#title": 'IntentName',
                        "#slot": 'Slot'
                    },
                    ExpressionAttributeValues: { ":title_val": intentName, ":slot_val": slot }
                };
            }
        } else {
            //emit to unhandle
            const unhandled = require('./areas/unhandled');
            return unhandled.handle(handlerInput);
        }
        

        var obj = await this.scanDynamoItem(params);
        return this.formSpeech(handlerInput, obj);
    },

    linkUser: function(handlerInput) {
        var ch = this;
        return new Promise((resolve, reject) => {
            var user = handlerInput.attributesManager.getSessionAttributes('GAMESTATE');
            if (user === null || Object.keys(user).length === 0) {
                var accessToken = handlerInput.requestEnvelope.session.user.accessToken;
                if (accessToken !== undefined) {
                    var uri = 'https://eis.gvsu.edu/oauth2/profile?access_token=' + accessToken;
                    console.log('get user profile from gvsu portal uri ==>', uri);
                    request(uri, function(err, response, body) {
                        console.log('linkUser log::err', err, 'response', response.statusCode, 'body', body);
                        if (err || response.statusCode !== 200) {
                            var attributes = {
                                GAMESTATE: {
                                    status: "UnLinked",
                                    data  : null
                                }  
                            }
                            handlerInput.attributesManager.setSessionAttributes(attributes);
                            user = handlerInput.attributesManager.getSessionAttributes('GAMESTATE').GAMESTATE;
                            resolve(user);
                        } else {
                            var data = JSON.parse(body);
                            // var emailID = data.emails[0].value;
                            // var demoEmailID = data.emails[0].value;
                            var attributes = {
                                GAMESTATE: {
                                    status: "Linked",
                                    data  : data
                                }  
                            }
                            handlerInput.attributesManager.setSessionAttributes(attributes);
                            user = handlerInput.attributesManager.getSessionAttributes('GAMESTATE').GAMESTATE;
                            resolve(user);
                        }
                    });
                } else {
                    var attributes = {
                        GAMESTATE: {
                            status: "UnLinked",
                            data  : null
                        }  
                    }
                    handlerInput.attributesManager.setSessionAttributes(attributes);
                    user = handlerInput.attributesManager.getSessionAttributes('GAMESTATE').GAMESTATE;
                    resolve(user);
                }
            } else {
                user = handlerInput.attributesManager.getSessionAttributes('GAMESTATE').GAMESTATE;
                resolve(user);
            }
        });
    },

    callPeopleFinder : function(buildingname) {
        console.log('callPeopleFinder buildingname : ',buildingname);
        return new Promise((resolve, rej) => {
            let url = process.env.REALTIME_SERVICE_URL+buildingname;
            request(url, function (error, response, body) {
                if (error) {
                    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                    resolve(null);
                } else if (!error && response.statusCode == 200) {
                    console.log(JSON.parse(body).data) ;
                    resolve(JSON.parse(body).data);
                }                
            });
        });
    },  
    
    contactInfodynamodbScanForAns : function(slot) {
        console.log('slot = ', slot);
        return new Promise((resolve, reject) => {
            var params = {
                TableName: this.StaticTable,
                FilterExpression: "#slot = :slotval and #intent = :intentval",
                ExpressionAttributeNames: {
                    "#slot": "Slot",
                    "#intent":"IntentName"
                },
                ExpressionAttributeValues: { ":slotval": slot ,":intentval":'ContactInfo'}
            };
            
			// Scan DynamoDB
			var docClient = new AWS.DynamoDB.DocumentClient();
			docClient.scan(params, (err, data) => {
				if(err) {
                    console.log('dynamodb scan err =>' + JSON.stringify(err))
                    resolve(null);                    
                }
                console.log('dynamodb scan res =>' + JSON.stringify(data))                
				if(data && data.Items.length > 0) {
                    resolve(data.Items[0]);
				} else {
                    resolve(null);
                }
			});
        });
    },

    contactInfoFn : function(handlerInput, slots){
        console.log('slots from contactInfoFn = ', slots);
        return new Promise((resolve, reject) => {
            // let slots = [buildingname, contacttype];
            // let slots = slotArr;
            let convJSON = {};
            console.log('Slots are::', JSON.stringify(slots));
            var buildingname = slots[0];
            var contacttype = slots[1];
            console.log("slots in contactInfoFn are::",buildingname, contacttype);
            //real time api call instead of DB call 
            return this.callPeopleFinder(buildingname).then((res) => {
                // console.log('people res ============================================='+res);
                if (res.length !== 0) {
                    if (res.length === 1) {
                        if(contacttype){
                            var buildData = res[0][contacttype];
                            // buildData = '616-331-2229';  //rapinbe@gvsu.edu';
                            // contacttype == 'email';
                            var splitmail = (contacttype == 'email') ? buildData.trim().split('').join(' ').replace('.','dot').replace('@', 'at')+'">' : '';
                            // console.log('splitmail ========== ',splitmail);
                            buildData = (contacttype == 'email') ? '<sub alias="'+ splitmail + buildData +'</sub>' : buildData;
                            //get the ans from DB based on 
                            return this.contactInfodynamodbScanForAns(contacttype).then((dbresp) => {
                                var speechText = dbresp.Answer;
                                speechText = speechText.replace('{ans1}', buildingname).replace('{ans2}', buildData);
                                console.log('people res ==speechText==========================================='+speechText);
                                obj = {
                                    speechText: speechText + ' ' + this.repromptSpeechText,
                                    displayText: speechText + ' ' + this.repromptSpeechText,
                                    repromptSpeechText: this.listenspeech,
                                    sessionEnd: false
                                }
                                // return this.formSpeech(handlerInput, obj);
                                resolve(this.formSpeech(handlerInput, obj));
                            });                                
                        }else{
                            let suggArr = [];
                            console.log(Object.keys(res[0]));
                            Object.keys(res[0]).forEach((key, i) => {
                                // console.log('=======================', res[0][key], ' pp ', !res[0][key]);
                                if(res[0][key] && (key != 'name')){
                                    suggArr.push(key);
                                }
                            });
                            console.log('suggArr :: ', suggArr.length, ' === ', suggArr);
                            if(suggArr.length === 1 ){
                                contactBy = suggArr[0];
                                var buildData = res[0][contactBy];
                                // buildData = '616-331-2229';  //rapinbe@gvsu.edu';
                                var splitmail = (contactBy == 'email') ? buildData.trim().split('').join(' ').replace('.','dot').replace('@', 'at')+'">' : '';
                                // console.log('splitmail ========== ',splitmail);
                                buildData = (contactBy == 'email') ? '<sub alias="'+ splitmail + buildData +'</sub>' : buildData;
                                //get the ans from DB based on 
                                return this.contactInfodynamodbScanForAns(contactBy).then((dbresp) => {
                                    var speechText = dbresp.Answer;
                                    speechText = speechText.replace('{ans1}', buildingname).replace('{ans2}', buildData);
                                    console.log('people res ==speechText==========================================='+speechText);
                                    obj = {
                                        speechText: speechText + ' ' + this.repromptSpeechText,
                                        displayText: speechText + ' ' + this.repromptSpeechText,
                                        repromptSpeechText: this.listenspeech,
                                        sessionEnd: false
                                    }
                                    // return this.formSpeech(handlerInput, obj);
                                    resolve(this.formSpeech(handlerInput, obj));
                                });  
                            }else{
                                var speechText = 'I can assist you with the '+ suggArr.join(', or, ') +  '. Which one would you like to know?';
                                obj = {
                                    speechText: speechText,
                                    displayStandardCardText: speechText,
                                    addElicitSlotDirective: 'contacttype'
                                }
                                // return this.formSpeech(handlerInput, obj);
                                resolve(this.formSpeech(handlerInput, obj));
                            }                                
                        }                            
                    }else {
                        let suggArr = [];
                        // let build = buildingname.replace(/[^A-Z0-9]+/ig,'').toLowerCase();
                        res.forEach((arrvalues, i) => {
                            suggArr.push(arrvalues.name);
                        });
                        var speechText = 'I can assist you with the '+ suggArr.join(', or, ') +  '. Which one would you like to know?';
                        obj = {
                            speechText: speechText,
                            displayStandardCardText: speechText,
                            addElicitSlotDirective: 'buildingname'
                        }
                        // return this.formSpeech(handlerInput, obj);
                        resolve(this.formSpeech(handlerInput, obj));
                    }
                } else {
                    var speechText = 'I could not find any contact details.';
                        obj = {
                            speechText: speechText + ' ' + this.repromptSpeechText,
                            displayText: speechText + ' ' + this.repromptSpeechText,
                            repromptSpeechText: this.listenspeech,
                            sessionEnd: false
                        }
                    // return this.formSpeech(handlerInput, obj);  
                    resolve(this.formSpeech(handlerInput, obj));                      
                }
            }).catch((err) => {
                console.log('ContactInfo Error::', err);
                var speechText = 'I could not find any contact details.';
                obj = {
                    speechText: speechText + ' ' + this.repromptSpeechText,
                    displayText: speechText + ' ' + this.repromptSpeechText,
                    repromptSpeechText: this.listenspeech,
                    sessionEnd: false
                }
                // return this.formSpeech(handlerInput, obj);       
                resolve(this.formSpeech(handlerInput, obj));
            })
        });
    }
}

const allFuctions = require('../functions');

const ContactInfo = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
            && handlerInput.requestEnvelope.request.intent.name === 'ContactInfo'
    },
    handle(handlerInput) {
        console.log("DefinedSlotIntents Handler::", handlerInput.requestEnvelope.request.intent.name);
        var intentName = handlerInput.requestEnvelope.request.intent.name;
        var contacttype = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.contacttype);
        var name = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.buildingname);
        console.log("slots in contact info are::",name, contacttype);
        let obj = null;

        // array to decide dynamically what contact type to keep and show
        const  contacttypeArr = new Map([
            ["phone","telephone number"],
            ["email address","email address"],
            ["address","address"]
        ]);

        try {
            var params = {
                TableName : "AskGVSUStatic"
            };
            let speechText = '';

            if (handlerInput.requestEnvelope.request.intent.confirmationStatus === 'DENIED') {
                obj = {
                    speechText: allFuctions.YesPrompt,
                    displayText: allFuctions.YesPrompt,
                    repromptSpeechText: allFuctions.listenspeech,
                    sessionEnd: false
                }
                return allFuctions.formSpeech(handlerInput, obj);
            }

            if (name) {

                // ned to put the DB logic
                params['FilterExpression'] = "contains (Slot,:Slot)";
                params['ExpressionAttributeValues'] = {
                    ":Slot" : name.replace(/\s/g,'').toLowerCase()
                }


                return allFuctions.fnDynamoScan(params, 'scan').then(res => {
                    console.log(JSON.stringify(res));
                    if (res === null || res.length === 0) {
                        speechText = 'Sorry no contact dettails found for ' + name + '. '+ allFuctions.repromptSpeechText;
                        obj = {
                            speechText: speechText,
                            displayText: speechText,
                            repromptSpeechText: allFuctions.listenspeech,
                            sessionEnd: false
                        }
                        return allFuctions.formSpeech(handlerInput, obj);
                    } else if (res.length > 1) { /* multiple bldgs with same name  */
                        const slotlist = [];
                        res.forEach(item => {
                            // need to put the logic for multiple buildings
                            
                            //bldglist.push(item.FirstName+" "+item.LastName+" from "+item['Department']);
                        });
                        speechText = "Would you like to get contact details "+bldglist.join(" or ")+"?";
                        obj = {
                            speechText: speechText,
                            displayStandardCardText: speechText,
                            addElicitSlotDirective: 'name'                        
                        }
                        return allFuctions.formSpeech(handlerInput, obj);
                    } else {
                        const fullname = res[0].Slot;
                        if (contacttype || handlerInput.requestEnvelope.request.intent.confirmationStatus === 'CONFIRMED') {
                            if (handlerInput.requestEnvelope.request.intent.confirmationStatus === 'CONFIRMED') {
                                speechText = fullname+" belongs to the "+res[0]['Department']+'. Email address would be <say-as interpret-as="characters">'+res[0]['EmailAddress']+'</say-as>, you can also dial him up at <say-as interpret-as="telephone">'+res[0]['TelephoneNo']+'</say-as> or reach his office at <say-as interpret-as="address">'+res[0]['Office']+"</say-as>."
                                obj = {
                                    speechText: speechText + ' ' + allFuctions.repromptSpeechText,
                                    displayText: speechText + ' ' + allFuctions.repromptSpeechText,
                                    repromptSpeechText: allFuctions.listenspeech,
                                    sessionEnd: false
                                }
                                return allFuctions.formSpeech(handlerInput, obj);
                            } else if (contacttype) {
                                const contacttypeVal = contacttypeArr.get(contacttype);
                                contacttypeArr.delete(contacttype);
                                const proposedContactTypes = Array.from(contacttypeArr.values());
                                let ansVal = '';
                                if (contacttype === 'TelephoneNo') {
                                    ansVal = '<say-as interpret-as="telephone">'+res[0][contacttype]+'</say-as>';
                                } else if (contacttype === 'EmailAddress') {
                                    ansVal = '<say-as interpret-as="characters">'+res[0][contacttype]+'</say-as>';                                
                                    // ansVal = '<sub alias="'+res[0][contacttype]+'">'+res[0][contacttype]+'</say-as>';
                                } else if (contacttype === 'Office') {
                                    ansVal = '<say-as interpret-as="address">'+res[0][contacttype]+'</say-as>';
    
                                } else {
                                    ansVal = res[0][contacttype];
                                }
                                speechText = fullname + "'s " + contacttypeVal + ' is ' + ansVal +'. '+ 
                                                "Would you also like to know " + fullname + "'s "+ proposedContactTypes.join(', ') +"?"
                                                ;
                                obj = {
                                    speechText: speechText,
                                    displayStandardCardText: speechText,
                                    addConfirmIntentDirective: currentIntent,
                                    slots: handlerInput.requestEnvelope.request.intent.slots
                                }
                                return allFuctions.formSpeech(handlerInput, obj);
                            }
        
                        } else if (!contacttype) {
                            speechText = "I can assist you with the " + Array.from(contacttypeArr.values()).join(', ') + " of " + fullname + ". Which contact information you want to know?";
                            obj = {
                                speechText: speechText,
                                displayStandardCardText: speechText,
                                addElicitSlotDirective: 'contacttype'
                            }
                            return allFuctions.formSpeech(handlerInput, obj);
                        }
                    }
                });
            } else {
                speechText = 'I could not get person name. Please say again.'
                obj = {
                    speechText: speechText,
                    displayStandardCardText: speechText,
                    addElicitSlotDirective: 'name'                        
                }
                return allFuctions.formSpeech(handlerInput, obj);
            }
        } catch (error) {
             console.log(error);   
        }


        var slot = [];
        slot.push(contacttype.toLowerCase().replace(/[^A-Z0-9]+/ig, ""));
        slot.push(buildingname.toLowerCase().replace(/[^A-Z0-9]+/ig, ""));
        //var slot = allFuctions.getSlotValue(handlerInput).toLowerCase().replace(/[^A-Z0-9]+/ig, "");
        // if (intentName === 'GetPhoneNumber') {
        //     slot = handlerInput.requestEnvelope.request.intent.slots.OfficePhoneNumber.value.toLowerCase().replace(/[^A-Z0-9]+/ig, "");
        //     console.log("slot for GetPhoneNumber::"+slot)
        // } else {
        //     slot = handlerInput.requestEnvelope.request.intent.slots.buildingname.value.toLowerCase().replace(/[^A-Z0-9]+/ig, "");
        // }
        return allFuctions.DynamoDBScan(slot, intentName, allFuctions.StaticTable).then((data) => {
            var obj = {
                speechText: allFuctions.noValueReturned,
                displayText: allFuctions.noValueReturned,
                repromptSpeechText: allFuctions.listenspeech
            };
            if(data !== null) {
                obj = {
                    speechText: data.Answer + ' What else would you like to know?',
                    displayText: data.Answer + ' What else would you like to know?',
                    repromptSpeechText: allFuctions.listenspeech
                }
            }
            return allFuctions.formSpeech(handlerInput, obj);
        });
    }
}

const OpenCloseTime = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
            && handlerInput.requestEnvelope.request.intent.name === 'OpenCloseTime'
    },

    handle(handlerInput) {
        console.log("DefinedSlotIntents Handler::", handlerInput.requestEnvelope.request.intent.name);
        var intentName = handlerInput.requestEnvelope.request.intent.name;
        var contacttype = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.openclose);
        var buildingname = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.buildingname);
        console.log("buildingname::",buildingname);
        console.log("openclose::",openclose);
        var slot = [];
        slot.push(contacttype.toLowerCase().replace(/[^A-Z0-9]+/ig, ""));
        slot.push(buildingname.toLowerCase().replace(/[^A-Z0-9]+/ig, ""));
        //var slot = allFuctions.getSlotValue(handlerInput).toLowerCase().replace(/[^A-Z0-9]+/ig, "");
        // if (intentName === 'GetPhoneNumber') {
        //     slot = handlerInput.requestEnvelope.request.intent.slots.OfficePhoneNumber.value.toLowerCase().replace(/[^A-Z0-9]+/ig, "");
        //     console.log("slot for GetPhoneNumber::"+slot)
        // } else {
        //     slot = handlerInput.requestEnvelope.request.intent.slots.buildingname.value.toLowerCase().replace(/[^A-Z0-9]+/ig, "");
        // }
        return allFuctions.DynamoDBScan(slot, intentName, allFuctions.StaticTable).then((data) => {
            var obj = {
                speechText: allFuctions.noValueReturned,
                displayText: allFuctions.noValueReturned,
                repromptSpeechText: allFuctions.listenspeech
            };
            if(data !== null) {
                obj = {
                    speechText: data.Answer + ' What else would you like to know?',
                    displayText: data.Answer + ' What else would you like to know?',
                    repromptSpeechText: allFuctions.listenspeech
                }
            }
            return allFuctions.formSpeech(handlerInput, obj);
        });
    }
}

module.exports = [ 
    ContactInfo,
    OpenCloseTime
];
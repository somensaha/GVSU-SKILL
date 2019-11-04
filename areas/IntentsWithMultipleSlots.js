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
        var buildingname = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.buildingname);
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

            if (buildingname) {
                let slots = [buildingname, contacttype];
                let convJSON = {};
                console.log('Slots are::', JSON.stringify(slots));
                let FilterExpression = 'IntentName = :IntentName';
                let ExpressionAttributeValues = {':IntentName': 'ContactInfo'};
                slots.forEach((slot, i) => {
                    if (slot) {
                        FilterExpression = FilterExpression + ' AND contains(Slot,:Slot'+i+')';
                        ExpressionAttributeValues[':Slot'+i] = slot.replace(/\s/g,'').toLowerCase();
                    }
                });
                var dynamodbScanParams = {TableName: "AskGVSUStatic", FilterExpression: FilterExpression, ExpressionAttributeValues: ExpressionAttributeValues};
                return allFuctions.contactInfodynamodbScan(dynamodbScanParams).then((res) => {
                    if (res.length !== 0) {
                        if (res.length === 1) {
                            var speechText = res[0].Answer;
                            obj = {
                                speechText: speechText + ' ' + allFuctions.repromptSpeechText,
                                displayText: speechText + ' ' + allFuctions.repromptSpeechText,
                                repromptSpeechText: allFuctions.listenspeech,
                                sessionEnd: false
                            }
                            return allFuctions.formSpeech(handlerInput, obj);
                        } else {
                            if (buildingname) {
                                return allFuctions.suggestionsFromJson({shuffle: true, slot: buildingname}).then((suggestionslot) => {
                                    var speechText = 'Are you looking for the '+buildingname+suggestionslot.join(' or ')+'?';
                                    obj = {
                                        speechText: speechText,
                                        displayStandardCardText: speechText,
                                        addElicitSlotDirective: 'contacttype'
                                    }
                                    return allFuctions.formSpeech(handlerInput, obj);
                                });
                            }
                        }
                    } else {
                        var speechText = 'I could not find any contact details.';
                            obj = {
                                speechText: speechText + ' ' + allFuctions.repromptSpeechText,
                                displayText: speechText + ' ' + allFuctions.repromptSpeechText,
                                repromptSpeechText: allFuctions.listenspeech,
                                sessionEnd: false
                            }
                        return allFuctions.formSpeech(handlerInput, obj);                        
                    }
                }).catch((err) => {
                    console.log('ContactInfo Error::', err);
                    var speechText = 'I could not find any contact details.';
                    obj = {
                        speechText: speechText + ' ' + allFuctions.repromptSpeechText,
                        displayText: speechText + ' ' + allFuctions.repromptSpeechText,
                        repromptSpeechText: allFuctions.listenspeech,
                        sessionEnd: false
                    }
                    return allFuctions.formSpeech(handlerInput, obj);       
                })
            } else {
                speechText = 'I could not get person name. Please say again.'
                obj = {
                    speechText: speechText,
                    displayStandardCardText: speechText,
                    addElicitSlotDirective: 'buildingname'                        
                }
                return allFuctions.formSpeech(handlerInput, obj);
            }
        } catch (error) {
             console.log(error);   
        }

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
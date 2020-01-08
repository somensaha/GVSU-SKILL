const allFuctions = require('../functions');
var request = require('request');

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
        var personname = handlerInput.requestEnvelope.request.intent.slots.personname.value;    //built-in slot
        console.log("slots in contact info are::",buildingname, contacttype, personname);
        
        let obj = null;

        try {
            var params = {
                TableName : "AskGVSUStatic"
            };
            let speechText = '';

            if (buildingname) {
                var slots = [buildingname, contacttype];
                return allFuctions.contactInfoFn(handlerInput, slots).then((res) => {
                    return res;
                });
            } else if(personname){     //if personname exist
                console.log('personname is ', personname);
                var slots = [personname, contacttype];
                return allFuctions.contactInfoFn(handlerInput, slots).then((res) => {
                    return res;
                });
            } else {                
                speechText = 'Whose contact details or which office information you are looking for?'
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
        var openclosetype = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.openclose);
        var buildingname = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.buildingname);
        console.log("slots in openclose time are::",buildingname, openclosetype);
        
        let obj = null;


        try {
            var params = {
                TableName : "AskGVSUStatic"
            };
            let speechText = '';

            if (buildingname) {
                let slots = [buildingname, openclosetype];
                let convJSON = {};
                console.log('Slots are::', JSON.stringify(slots));
                let FilterExpression = 'IntentName = :IntentName';
                let ExpressionAttributeValues = {':IntentName': 'OpenCloseTime'};
                slots.forEach((slot, i) => {
                    if (slot) {
                        FilterExpression = FilterExpression + ' AND contains(Slot,:Slot'+i+')';
                        ExpressionAttributeValues[':Slot'+i] = slot.replace(/[^A-Z0-9]+/ig,'').toLowerCase();
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
                                return allFuctions.suggestionsFromJson({shuffle: true, slot: buildingname, intent:intentName}).then((suggestionslot) => {
                                    var speechText = 'I can assist you with the '+ suggestionslot.join(' or, ') +  '. Which one would you like to know?';
                                    obj = {
                                        speechText: speechText,
                                        displayStandardCardText: speechText,
                                        addElicitSlotDirective: 'openclosetype'
                                    }
                                    return allFuctions.formSpeech(handlerInput, obj);
                                });
                            }
                        }
                    } else {
                        var speechText = 'I could not find any timing details.';
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
                    var speechText = 'I could not find any timing details.';
                    obj = {
                        speechText: speechText + ' ' + allFuctions.repromptSpeechText,
                        displayText: speechText + ' ' + allFuctions.repromptSpeechText,
                        repromptSpeechText: allFuctions.listenspeech,
                        sessionEnd: false
                    }
                    return allFuctions.formSpeech(handlerInput, obj);       
                })
            } else {
                speechText = 'Which office open or close timing details you are looking for?'
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

const GVSUServiceMultiSlot = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
            && handlerInput.requestEnvelope.request.intent.name === 'GVSUServiceMultiSlot'
    },
    handle(handlerInput) {
        console.log("DefinedSlotIntents Handler::", handlerInput.requestEnvelope.request.intent.name);
        var intentName = handlerInput.requestEnvelope.request.intent.name;
        var servicename = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.servicename);
        var buildingname = allFuctions.getDialogSlotValue(handlerInput.requestEnvelope.request.intent.slots.buildingname);
        console.log("slots in GVSUServiceMultiSlot time are::",buildingname, servicename);
        
        let obj = null;


        try {
            var params = {
                TableName : "AskGVSUStatic"
            };
            let speechText = '';

            if (buildingname) {
                let slots = [buildingname, servicename];
                let convJSON = {};
                console.log('Slots are::', JSON.stringify(slots));
                let FilterExpression = 'IntentName = :IntentName';
                let ExpressionAttributeValues = {':IntentName': 'GVSUServiceMultiSlot'};
                slots.forEach((slot, i) => {
                    if (slot) {
                        FilterExpression = FilterExpression + ' AND contains(Slot,:Slot'+i+')';
                        ExpressionAttributeValues[':Slot'+i] = slot.replace(/[^A-Z0-9]+/ig,'').toLowerCase();
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
                                return allFuctions.suggestionsFromJson({shuffle: true, slot: buildingname, intent:intentName}).then((suggestionslot) => {
                                    var speechText = 'I can assist you with the '+ suggestionslot.join(' or ') +  '. Which one would you like to know?';
                                    obj = {
                                        speechText: speechText,
                                        displayStandardCardText: speechText,
                                        addElicitSlotDirective: 'servicename'
                                    }
                                    return allFuctions.formSpeech(handlerInput, obj);
                                });
                            }
                        }
                    } else {
                        var speechText = 'I could not find any timing details.';
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
                    var speechText = 'I could not find any timing details.';
                    obj = {
                        speechText: speechText + ' ' + allFuctions.repromptSpeechText,
                        displayText: speechText + ' ' + allFuctions.repromptSpeechText,
                        repromptSpeechText: allFuctions.listenspeech,
                        sessionEnd: false
                    }
                    return allFuctions.formSpeech(handlerInput, obj);       
                })
            } else {
                speechText = 'Which office service details you are looking for?'
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

module.exports = [ 
    ContactInfo,
    OpenCloseTime,
    GVSUServiceMultiSlot
];
const allFuctions = require('../functions');
// const demoAnswerJSON = require('./../demoAnswer.json');

// var flagForstatus = false;
const REALIntents = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (
                handlerInput.requestEnvelope.request.intent.name === 'MyAdvisorsLocation'
                || handlerInput.requestEnvelope.request.intent.name === 'MyAdvisors'
                || handlerInput.requestEnvelope.request.intent.name === 'NextClassTimeReal'
                || handlerInput.requestEnvelope.request.intent.name === 'NextClassLocationReal'
                || handlerInput.requestEnvelope.request.intent.name === 'GeneralInstructorReal'
                || handlerInput.requestEnvelope.request.intent.name === 'GeneralInstructorContactInfoReal'
                || handlerInput.requestEnvelope.request.intent.name === 'MyAdvisorsPhoneNo'
                || handlerInput.requestEnvelope.request.intent.name === 'ClassDayOfWeekReal'
            )
    }, handle(handlerInput) {
        // console.log('flagForstatus handlerInput top ===== ', flagForstatus);
           var serviceType = '';
        //    var flagForstatus = false;
        // return allFuctions.linkUser(handlerInput).then((userdata) => {
            const currentIntent = handlerInput.requestEnvelope.request.intent;
            console.log("AllAuthenticated Handler Intent:: ", currentIntent);
            console.log("AllAuthenticated Handler Slots:: ", JSON.stringify(handlerInput.requestEnvelope.request.intent.slots));          
            // ;
            if(handlerInput.requestEnvelope.request.intent.name == 'MyAdvisors'){
                if (handlerInput.requestEnvelope.request.intent.confirmationStatus === 'CONFIRMED') {
                    // flagForstatus = true;
                    handlerInputConfig = handlerInput;
                    var slotconfig = handlerInput.requestEnvelope.request.intent.slots.advisortype;
                    slotconfig['name'] = 'advisortypephone';
                    console.log('slotconfig', slotconfig);
                    handlerInputConfig.requestEnvelope.request.intent.slots['advisortypephone'] = slotconfig;
                    delete handlerInputConfig.requestEnvelope.request.intent.slots['advisortype'];
                    console.log('handlerInputConfig slot', JSON.stringify(handlerInputConfig.requestEnvelope.request.intent));
                    handlerInputConfig.requestEnvelope.request.intent.name = 'MyAdvisorsPhoneNo';
                    handlerInputConfig.requestEnvelope.request.intent.confirmationStatus = 'NONE';
                    console.log('It\'s yessssssssss', JSON.stringify(handlerInputConfig.requestEnvelope.request));
                    return REALIntents.handle(handlerInputConfig);
                    
                } else if (handlerInput.requestEnvelope.request.intent.confirmationStatus === 'DENIED') {
                    obj = {
                        speechText: allFuctions.repromptSpeechText,
                        displayText: allFuctions.repromptSpeechText,
                        repromptSpeechText: allFuctions.listenspeech
                    }
                    return allFuctions.formSpeech(handlerInput, obj);
                } 
                console.log("advisor type::",handlerInput.requestEnvelope.request.intent.slots.advisortype);
                serviceType = handlerInput.requestEnvelope.request.intent.slots.advisortype.value;
            }else if (handlerInput.requestEnvelope.request.intent.name == 'GeneralInstructorReal'){
                if (handlerInput.requestEnvelope.request.intent.confirmationStatus === 'CONFIRMED') {
                    // flagForstatus = true;
                    // console.log('flagForstatus 1 ===== ', flagForstatus);
                    handlerInputConfig = handlerInput;
                    var slotconfig = handlerInput.requestEnvelope.request.intent.slots.nextclassname;
                    console.log('slotconfig', slotconfig);
                    handlerInputConfig.requestEnvelope.request.intent.name = 'GeneralInstructorContactInfoReal';
                    // handlerInputConfig.requestEnvelope.request.intent.confirmationStatus = 'NONE';
                    console.log('It\'s yessssssssss', JSON.stringify(handlerInputConfig.requestEnvelope.request));
                    return REALIntents.handle(handlerInputConfig);                  
                }  else if (handlerInput.requestEnvelope.request.intent.confirmationStatus === 'DENIED') {
                    obj = {
                        speechText: allFuctions.repromptSpeechText,
                        displayText: allFuctions.repromptSpeechText,
                        repromptSpeechText: allFuctions.listenspeech
                    }
                    return allFuctions.formSpeech(handlerInput, obj);
                } 
                console.log("Professor::",handlerInput.requestEnvelope.request.intent.slots.nextclassname.value)
                serviceType = handlerInput.requestEnvelope.request.intent.slots.nextclassname.value;
            }else if (handlerInput.requestEnvelope.request.intent.name == 'NextClassTimeReal' && 
            // handlerInput.requestEnvelope.request.intent.slots.nextclassname.value){
                typeof handlerInput.requestEnvelope.request.intent.slots.nextclassname.value === 'undefined'){
                console.log("next class::",handlerInput.requestEnvelope.request.intent.slots.nextclassname.value)
                serviceType = 'Physics';
            }else if (handlerInput.requestEnvelope.request.intent.name == 'ClassDayOfWeekReal'){
                serviceType = handlerInput.requestEnvelope.request.intent.slots.dayofweek.value;
            // }else if (handlerInputConfig.requestEnvelope.request.intent.name = 'GeneralInstructorContactInfoReal'){
            //     flagForstatus = false;
            }else{
                serviceType = allFuctions.getSlotValue(handlerInput);
            }
            console.log("AllAuthenticated Handler:: currentIntent::" +currentIntent.name+" serviceType::" +serviceType);
            // flagForstatus = false;
            if (typeof serviceType != 'undefined' && serviceType != null) {
                serviceType = serviceType.toLowerCase();
                serviceType = serviceType.trim();
                serviceType = serviceType.replace(/\s|\.|\-/g, '');
                return allFuctions.slotForRealTime(handlerInput, serviceType);
            } else {
                var obj = {
                    speechText: allFuctions.noValueReturned,
                    displayText: allFuctions.noValueReturned,
                    repromptSpeechText: allFuctions.listenspeech
                }
                return allFuctions.formSpeech(handlerInput, obj);
            }
            // console.log('flagForstatus handlerInput end ===== ', flagForstatus);
            // flagForstatus = false;
        // });
    }
}

module.exports = [
    REALIntents
];
import React, {useState, useRef, useEffect} from 'react';
import CheckBox from '@react-native-community/checkbox';
import {
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import {CFPaymentGatewayService, CFCard} from 'react-native-cashfree-pg-sdk';
import {
  Card,
  CFCardPayment,
  CFDropCheckoutPayment,
  CFEnvironment,
  CFPaymentComponentBuilder,
  CFPaymentModes,
  CFSession,
  CFThemeBuilder,
  CFUPI,
  CFUPIIntentCheckoutPayment,
  CFUPIPayment,
  SavedCard,
  UPIMode,
  ElementCard,
} from 'cashfree-pg-api-contract';

const BASE_RESPONSE_TEXT = 'Payment Status will be shown here.';

const App = () => {
  const creditCardRef = useRef(null);
  const [state, setState] = useState({
    responseText: BASE_RESPONSE_TEXT,
    cardNumber: '',
    cardHolderName: '',
    cardExpiryMM: '',
    cardExpiryYY: '',
    cardCVV: '',
    orderId: 'order_342fuAjbdkqC3DVHX18iy24dP4ArK',
    sessionId:
      'session_Ulz4xwKmTx-4nNZTIk40n5beAXmWxMiqegtqYMcgrdsqqaxnU0mqTa15NjkAlz1M4oJcwOGyjqNQCKTEhQZAm9ekeM4VIllrICSn4t80XI3o',
    instrumentId: '',
    toggleCheckBox: false,
    cfEnv: '',
    upiId: '',
    cardNetwork: require('./assests/visa.png'),
  });

  const updateStatus = message => {
    setState(prevState => ({...prevState, responseText: message}));
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  const handleInputChange = (name, value) => {
    setState(prevState => ({...prevState, [name]: value}));
  };

  const handleCFCardInput = data => {
    console.log('CFCardInput FROM SDK', data);
    const cardNetwork = JSON.parse(data)['card_network'];
    const networkImages = {
      visa: require('./assests/visa.png'),
      mastercard: require('./assests/mastercard.png'),
      amex: require('./assests/amex.png'),
      maestro: require('./assests/maestro.png'),
      rupay: require('./assests/rupay.png'),
      diners: require('./assests/diners.png'),
      discover: require('./assests/discover.png'),
      jcb: require('./assests/jcb.png'),
    };
    setState(prevState => ({
      ...prevState,
      cardNetwork: networkImages[cardNetwork] || require('./assests/visa.png'),
    }));
  };

  useEffect(() => {
    CFPaymentGatewayService.setEventSubscriber({
      onReceivedEvent(eventName, map) {
        console.log(
          'Event received on screen: ' +
            eventName +
            ' map: ' +
            JSON.stringify(map),
        );
      },
    });

    CFPaymentGatewayService.setCallback({
      onVerify(orderID) {
        console.log('orderId is :' + orderID);
        updateStatus(orderID);
      },
      onError(error, orderID) {
        console.log(
          'exception is : ' +
            JSON.stringify(error) +
            '\norderId is :' +
            orderID,
        );
        updateStatus(JSON.stringify(error));
      },
    });

    return () => {
      console.log('UNMOUNTED');
      CFPaymentGatewayService.removeCallback();
      CFPaymentGatewayService.removeEventSubscriber();
    };
  }, []);

  const getSession = () => {
    return new CFSession(
      state.sessionId,
      state.orderId,
      state.cfEnv === 'PROD' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    );
  };

  const startCheckout = async () => {
    try {
      const session = getSession();
      const paymentModes = new CFPaymentComponentBuilder()
        .add(CFPaymentModes.CARD)
        .add(CFPaymentModes.UPI)
        .add(CFPaymentModes.NB)
        .add(CFPaymentModes.WALLET)
        .add(CFPaymentModes.PAY_LATER)
        .build();
      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#E64A19')
        .setNavigationBarTextColor('#FFFFFF')
        .setButtonBackgroundColor('#FFC107')
        .setButtonTextColor('#FFFFFF')
        .setPrimaryTextColor('#212121')
        .setSecondaryTextColor('#757575')
        .build();
      const dropPayment = new CFDropCheckoutPayment(
        session,
        paymentModes,
        theme,
      );
      console.log(JSON.stringify(dropPayment));
      CFPaymentGatewayService.doPayment(dropPayment);
    } catch (e) {
      console.log(e.message);
    }
  };

  const startWebCheckout = async () => {
    try {
      const session = getSession();
      console.log('Session', JSON.stringify(session));
      CFPaymentGatewayService.doWebPayment(JSON.stringify(session));
    } catch (e) {
      console.log(e.message);
    }
  };

  const startCardPayment = async () => {
    try {
      const session = getSession();
      console.log('Session', JSON.stringify(session));
      const card = new Card(
        state.cardNumber,
        state.cardHolderName,
        state.cardExpiryMM,
        state.cardExpiryYY,
        state.cardCVV,
        state.toggleCheckBox,
      );
      console.log('Card', JSON.stringify(card));
      const cardPayment = new CFCardPayment(session, card);
      CFPaymentGatewayService.makePayment(cardPayment);
    } catch (e) {
      console.log(e.message);
    }
  };

  const startSavedCardPayment = async () => {
    try {
      const session = getSession();
      console.log('Session', JSON.stringify(session));
      const card = new SavedCard(state.instrumentId, state.cardCVV);
      const cardPayment = new CFCardPayment(session, card);
      CFPaymentGatewayService.makePayment(cardPayment);
    } catch (e) {
      console.log(e.message);
    }
  };

  const startUPICheckout = async () => {
    try {
      const session = getSession();
      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#E64A19')
        .setNavigationBarTextColor('#FFFFFF')
        .setButtonBackgroundColor('#FFC107')
        .setButtonTextColor('#FFFFFF')
        .setPrimaryTextColor('#212121')
        .setSecondaryTextColor('#757575')
        .build();
      const upiPayment = new CFUPIIntentCheckoutPayment(session, theme);
      console.log(JSON.stringify(upiPayment));
      CFPaymentGatewayService.doUPIPayment(upiPayment);
    } catch (e) {
      console.log(e.message);
    }
  };

  const makeUpiCollectPayment = async () => {
    try {
      const session = getSession();
      console.log('Session', JSON.stringify(session));
      const upi = new CFUPI(UPIMode.COLLECT, state.upiId);
      const cfUpiPayment = new CFUPIPayment(session, upi);
      CFPaymentGatewayService.makePayment(cfUpiPayment);
    } catch (e) {
      console.log(e.message);
    }
  };

  const makeUpiIntentPayment = async () => {
    const apps = await CFPaymentGatewayService.getInstalledUpiApps();
    console.log('Callback for Fetch UPI Apps :::==>' + apps);
    let id = '';
    JSON.parse(apps).forEach(item => {
      id = item.appPackage;
    });
    try {
      const session = getSession();
      console.log('Session', JSON.stringify(session));
      const upi = new CFUPI(UPIMode.INTENT, state.upiId);
      const cfUpiPayment = new CFUPIPayment(session, upi);
      CFPaymentGatewayService.makePayment(cfUpiPayment);
    } catch (e) {
      console.log(e.message);
    }
  };

  const handleSubmit = () => {
    console.log('TYPE', creditCardRef);
    if (creditCardRef.current) {
      let nonPciCard = new ElementCard(
        state.cardHolderName,
        state.cardExpiryMM,
        state.cardExpiryYY,
        state.cardCVV,
        state.toggleCheckBox,
      );
      console.log('KISHANTEST', JSON.stringify(nonPciCard));
      creditCardRef.current.doPayment(nonPciCard);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        {/* <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Session Id"
            keyboardType="default"
            onChangeText={value => handleInputChange('sessionId', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Order Id"
            keyboardType="default"
            onChangeText={value => handleInputChange('orderId', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="SANDBOX"
            keyboardType="default"
            onChangeText={value => handleInputChange('cfEnv', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter VPA for Collect or PSP app package"
            keyboardType="default"
            onChangeText={value => handleInputChange('upiId', value)}
          />
        </View> */}
        <View style={styles.button}>
          <Button onPress={startCheckout} title="Start Payment" />
        </View>
        {/* <View style={styles.button}>
          <Button onPress={startWebCheckout} title="Start Web Payment" />
        </View> */}
        {/* <View style={styles.button}>
          <Button
            onPress={startUPICheckout}
            title="Start UPI Intent Checkout Payment"
          />
        </View>
        <View style={styles.button}>
          <Button
            onPress={makeUpiCollectPayment}
            title="Make UPI Collect Payment"
          />
        </View>
        <View style={styles.button}>
          <Button
            onPress={makeUpiIntentPayment}
            title="Make UPI Intent Payment"
          />
        </View> */}
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>{state.responseText}</Text>
        </View>
        {/* <View style={styles.cardSection}>
          <View style={styles.cardContainer}>
            <CFCard
              cfSession={getSession()}
              style={{flex: 1}}
              cardListener={handleCFCardInput}
              placeholder="Enter Card Number"
              placeholderTextColor="#0000ff"
              underlineColorAndroid="transparent"
              cursorColor="gray"
              returnKeyType="next"
              ref={creditCardRef}
              onSubmitEditing={e =>
                console.log(
                  'onSubmitEditing',
                  e.nativeEvent.text,
                  '::',
                  e.target.value,
                )
              }
              onEndEditing={e =>
                console.log(
                  'onEndEditing',
                  e.nativeEvent.text,
                  '::',
                  e.target.value,
                )
              }
              onBlur={e =>
                console.log('onBlur', e.nativeEvent.text, '::', e.target.value)
              }
              onFocus={e =>
                console.log('onFocus', e.nativeEvent.text, '::', e.target.value)
              }
              onSelectionChange={e =>
                console.log(
                  'onSelectionchange',
                  e.nativeEvent.text,
                  '::',
                  e.target.value,
                )
              }
              onKeyPress={e =>
                console.log(
                  'onSelectionchange',
                  e.nativeEvent.text,
                  '::',
                  e.target.value,
                )
              }
            />
            <Image style={styles.cardImage} source={state.cardNetwork} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Holder Name"
            keyboardType="default"
            placeholderTextColor="#0000ff"
            underlineColorAndroid="transparent"
            cursorColor="gray"
            onChangeText={value => handleInputChange('cardHolderName', value)}
          />
          <View style={styles.cardDetailsContainer}>
            <TextInput
              style={styles.input}
              placeholder="Expiry Month"
              keyboardType="numeric"
              maxLength={2}
              placeholderTextColor="#0000ff"
              underlineColorAndroid="transparent"
              cursorColor="gray"
              onChangeText={value => handleInputChange('cardExpiryMM', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Expiry Year"
              keyboardType="numeric"
              maxLength={2}
              placeholderTextColor="#0000ff"
              underlineColorAndroid="transparent"
              cursorColor="gray"
              onChangeText={value => handleInputChange('cardExpiryYY', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="CVV"
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry={true}
              onChangeText={value => handleInputChange('cardCVV', value)}
            />
          </View>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={state.toggleCheckBox}
              onValueChange={value =>
                handleInputChange('toggleCheckBox', value)
              }
            />
            <Text>Save Card for future payment</Text>
          </View>
          <View style={styles.button}>
            <Button onPress={handleSubmit} title="Card Payment" />
          </View>
        </View> */}
        {/* <View style={styles.savedCardSection}>
          <TextInput
            style={styles.input}
            placeholder="Instrument Id"
            keyboardType="default"
            onChangeText={value => handleInputChange('instrumentId', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="CVV"
            keyboardType="numeric"
            maxLength={3}
            secureTextEntry={true}
            onChangeText={value => handleInputChange('cardCVV', value)}
          />
          <View style={styles.button}>
            <Button
              onPress={startSavedCardPayment}
              title="Saved Card Payment"
            />
          </View>
        </View> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Platform.OS === 'ios' ? 56 : 24,
    backgroundColor: '#eaeaea',
    alignItems: 'center',
    flexDirection: 'column',
    flex: 1,
  },
  inputContainer: {
    borderWidth: 1,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  button: {
    color: '#61aafb',
    margin: 8,
    width: 200,
  },
  responseContainer: {
    borderWidth: 1,
    alignSelf: 'stretch',
    textAlign: 'center',
    marginBottom: 10,
  },
  responseText: {
    margin: 16,
    fontSize: 14,
    color: 'black',
  },
  cardSection: {
    borderWidth: 1,
    alignSelf: 'stretch',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  cardNetworkImage: {
    margin: 5,
  },
  cardDetailsContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    textAlign: 'center',
  },
  savedCardSection: {
    borderWidth: 1,
    alignSelf: 'stretch',
  },
});

export default App;

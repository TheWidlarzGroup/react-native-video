/**
 * Sample React Native App for Video Plugin Sample
 * Windows Win32 Demo
 */

import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  ScrollView,
} from 'react-native';
import {multiply} from './src/index';

const App = () => {
  const [number1, setNumber1] = useState('5');
  const [number2, setNumber2] = useState('7');
  const [result, setResult] = useState(null);

  const handleMultiply = async () => {
    try {
      const num1 = parseInt(number1, 10);
      const num2 = parseInt(number2, 10);
      
      if (isNaN(num1) || isNaN(num2)) {
        setResult('Please enter valid numbers');
        return;
      }

      const res = await multiply(num1, num2);
      setResult(`${num1} × ${num2} = ${res}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Video Plugin Sample Demo</Text>
        <Text style={styles.subtitle}>Windows Win32 Application</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TurboModule Multiply Function</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number 1:</Text>
            <TextInput
              style={styles.input}
              value={number1}
              onChangeText={setNumber1}
              keyboardType="numeric"
              placeholder="Enter first number"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number 2:</Text>
            <TextInput
              style={styles.input}
              value={number2}
              onChangeText={setNumber2}
              keyboardType="numeric"
              placeholder="Enter second number"
            />
          </View>

          <Button title="Multiply" onPress={handleMultiply} />

          {result !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About This Demo</Text>
          <Text style={styles.infoText}>
            This is a Windows Win32 desktop application built with React Native.
            It demonstrates a TurboModule implementation for the react-native-video-plugin-sample.
          </Text>
          <Text style={styles.infoText}>
            The multiply function is implemented in native C++ code and called from JavaScript,
            showcasing the turbomodule architecture.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
});

export default App;

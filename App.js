import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PokemonDetailScreen from './src/screens/PokemonDetailScreen';
import AddPokemonScreen from './src/screens/AddPokemonScreen';
import CardMatchScreen from './src/screens/CardMatchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import PokemonTitle from './src/components/PokemonTitle';

const Stack = createNativeStackNavigator();

function AuthGate() {
  const { ready, isAuthenticated } = useAuth();

  if (!ready) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AppNavigator />;
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#d32f2f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800', color: '#fff' },
          contentStyle: { backgroundColor: '#1e3a8a' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddPokemon"
          component={AddPokemonScreen}
          options={{ title: 'Add Pokémon' }}
        />
        <Stack.Screen
          name="PokemonDetail"
          component={PokemonDetailScreen}
          options={{ title: 'Pokémon Details' }}
        />
        <Stack.Screen
          name="CardMatch"
          component={CardMatchScreen}
          options={{
            headerTitle: () => (
              <PokemonTitle style={{ fontSize: 20, fontWeight: '900', letterSpacing: 1 }}>
                Pokémon Card Match
              </PokemonTitle>
            ),
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PokemonSolid: require('./assets/fonts/PokemonSolid.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppProvider>
        <AuthGate />
      </AppProvider>
    </AuthProvider>
  );
}

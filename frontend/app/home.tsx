import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E5EC9" />
      
      {/* HEADER */}
      <LinearGradient colors={['#2E5EC9', '#4675D9']} style={styles.header}>
        <SafeAreaView style={{width: '100%'}}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Hola, Matías 👋</Text>
              <Text style={styles.degreeText}>Ingeniería en Sistemas</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/100?img=33' }} 
                style={styles.profileImg} 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* --- SECCIÓN PRINCIPAL: LO URGENTE --- */}
        <Text style={styles.sectionTitle}>PRIORITARIO</Text>

        {/* 1. FINALES */}
        <TouchableOpacity 
          style={styles.mainCard} 
          onPress={() => router.push('/finales')}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={['#007AFF', '#0055FF']} 
            style={styles.iconBox}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="star" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.cardTextContainer}>
            <Text style={styles.mainCardTitle}>Mesas Finales</Text>
            <Text style={styles.mainCardSubtitle}>Inscripciones y fechas</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        {/* 2. PARCIALES */}
        <TouchableOpacity 
          style={styles.mainCard} 
          onPress={() => router.push('/parciales')}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={['#FF9500', '#FF7F00']} 
            style={styles.iconBox}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="calendar" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.cardTextContainer}>
            <Text style={styles.mainCardTitle}>Parciales y Entregas</Text>
            <Text style={styles.mainCardSubtitle}>Próximos vencimientos</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>


        {/* --- GRID DE HERRAMIENTAS --- */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>MI CARRERA</Text>

        <View style={styles.grid}>
          {/* Botón 1: Mis Materias */}
          <GridButton 
            icon="book-outline" 
            label="Mis Materias" 
            color="#4CAF50" 
            onPress={() => router.push('/plan-estudios')}
          />
          
          {/* Botón 2: Horarios */}
          <GridButton 
            icon="time-outline" 
            label="Horarios" 
            color="#9C27B0" 
            onPress={() => router.push('/horarios')}
          />
          
          {/* Botón 3: SIMULADOR (¡Recuperado!) */}
          <GridButton 
            icon="calculator-outline" 
            label="Simulador" 
            color="#FF5722" 
            onPress={() => router.push('/simulador')}
          />
          
          {/* Botón 4: Mapa */}
          <GridButton
            icon="map-outline"
            label="Mapa"
            color="#E91E63"
            onPress={() => router.push('/mapa' as any)}
          />

          {/* Botón 5: Repositorio */}
          <GridButton
            icon="folder-open-outline"
            label="Repositorio"
            color="#607D8B"
            onPress={() => router.push('/repositorio' as any)}
          />
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

// Componente botón cuadrado
const GridButton = ({ icon, label, color, onPress }: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.gridBtn} onPress={onPress}>
    <View style={[styles.gridIconCircle, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon as any} size={28} color={color} />
    </View>
    <Text style={styles.gridLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  welcomeText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  degreeText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  profileBtn: { padding: 2, backgroundColor: '#fff', borderRadius: 25 },
  profileImg: { width: 45, height: 45, borderRadius: 22.5 },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#8898AA', marginBottom: 12, letterSpacing: 1 },

  // Tarjetas principales (Largas)
  mainCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12, 
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  iconBox: {
    width: 45, height: 45, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  cardTextContainer: { flex: 1 },
  mainCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  mainCardSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },

  // Grid (Botones cuadrados)
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridBtn: {
    width: (width - 55) / 2, // 2 columnas con espacio
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1
  },
  gridIconCircle: {
    width: 55, height: 55, borderRadius: 27.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10
  },
  gridLabel: { fontSize: 14, fontWeight: '600', color: '#444' }
});
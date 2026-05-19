// components/MiningDiagnosticModal.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X, Zap, ShieldCheck, Users } from 'lucide-react-native';
import { useTheme } from '../src/context/ThemeContext';

interface DiagnosticModalProps {
  visible: boolean;
  onClose: () => void;
  hashrate: number;
  isBoostActive: boolean;
  boostMultiplier: number; // Misal 0.5 untuk +50%
  teamRewardPercent: number; // Misal 0 untuk sekarang
}

export default function MiningDiagnosticModal({ 
  visible, 
  onClose, 
  hashrate, 
  isBoostActive, 
  boostMultiplier,
  teamRewardPercent 
}: DiagnosticModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: '#00f2ff' }]}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: '#fff' }]}>MINING_DIAGNOSTIC</Text>
              <Text style={[styles.subtitle, { color: '#64748b' }]}>SYSTEM_STABLE_V3.0</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* MAIN HASHRATE DISPLAY */}
          <View style={[styles.mainStatBox, { borderColor: '#00f2ff' }]}>
            <Text style={[styles.statLabel, { color: '#64748b' }]}>CURRENT_MINING_RATE</Text>
            <Text style={[styles.statValue, { color: '#fff' }]}>
              {hashrate.toFixed(4)} ASH/HR
            </Text>
          </View>

          {/* BREAKDOWN STATS */}
          <View style={styles.statsList}>
            
            {/* Base Rate */}
            <View style={styles.statRow}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Zap size={16} color="#fbbf24" />
                <Text style={[styles.rowLabel, { color: '#94a3b8' }]}>BASE_RATE</Text>
              </View>
              <Text style={[styles.rowValue, { color: '#fff' }]}>0.0480</Text>
            </View>

            {/* Boosters */}
            <View style={styles.statRow}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <ShieldCheck size={16} color={isBoostActive ? "#00ff88" : "#64748b"} />
                <Text style={[styles.rowLabel, { color: '#94a3b8' }]}>BOOSTERS (SC)</Text>
              </View>
              <Text style={[styles.rowValue, { color: isBoostActive ? "#00ff88" : "#64748b" }]}>
                +{(boostMultiplier * 100).toFixed(0)}%
              </Text>
            </View>

            {/* Team Rewards */}
            <View style={styles.statRow}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Users size={16} color="#64748b" />
                <Text style={[styles.rowLabel, { color: '#94a3b8' }]}>REWARDS (TEAM)</Text>
              </View>
              <Text style={[styles.rowValue, { color: '#64748b' }]}>
                +{teamRewardPercent.toFixed(0)}%
              </Text>
            </View>

          </View>

          {/* INFO TEXT */}
          <View style={styles.infoBox}>
            <Text style={[styles.infoText, { color: '#94a3b8' }]}>
              ℹ️ Keep 3-5 trusted Pioneers in your security circle to maximize node stability.
            </Text>
          </View>

          {/* CONFIRM BUTTON */}
          <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
            <Text style={styles.confirmText}>CONFIRM_DIAGNOSTIC</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', borderRadius: 24, padding: 24, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 12, fontFamily: 'monospace', marginTop: 2 },
  closeBtn: { padding: 4 },
  mainStatBox: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  statLabel: { fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: '800', fontFamily: 'monospace' },
  statsList: { marginBottom: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowValue: { fontSize: 16, fontWeight: '700', fontFamily: 'monospace' },
  infoBox: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 12, lineHeight: 18 },
  confirmBtn: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#0f172a', fontWeight: '800', fontSize: 14, letterSpacing: 1 }
});
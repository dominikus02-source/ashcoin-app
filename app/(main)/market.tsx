// app/(main)/market.tsx
import { Globe, ShieldCheck, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore, themes, translations } from '../../src/stores/useSettingsStore';

import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
}

interface NewsItem {
  title: string;
  source: string;
  time: string;
}

export default function MarketScreen() {
  const [ashPrice, setAshPrice] = useState<number | null>(null);
  const [topCrypto, setTopCrypto] = useState<CryptoCoin[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, language } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];

  const fetchData = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false');
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      const data = await res.json();
      setTopCrypto(data);

      setNews([
        { title: "Bitcoin Surges Past $90k Mark", source: "CryptoDaily", time: language === 'id' ? '2 jam lalu' : "2h ago" },
        { title: "New Regulations Impact Global Markets", source: "CoinDesk", time: language === 'id' ? '5 jam lalu' : "5h ago" },
        { title: "ASH Protocol Announces V2 Upgrade", source: "Official", time: language === 'id' ? '1 hari lalu' : "1d ago" },
      ]);

      setAshPrice(0.63); 

    } catch (error) {
      console.error("Error fetching market data:", error);
      Alert.alert(t.error, t.marketLoadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{t.loadingMarketData}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.market}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.liveCryptoData}</Text>
        </View>

        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t.ashPrice}</Text>
          <Text style={[styles.priceValue, { color: colors.text }]}>${ashPrice?.toFixed(2) || '0.00'}</Text>
          <Text style={[styles.priceSub, { color: colors.textSecondary }]}>≈ Rp 10.000 IDR</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.topCryptos}</Text>
          {topCrypto.map((coin) => (
            <View key={coin.id} style={[styles.cryptoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image source={{ uri: coin.image }} style={styles.coinImg} />
              <View style={{flex: 1}}>
                <Text style={[styles.coinName, { color: colors.text }]}>{coin.name}</Text>
                <Text style={[styles.coinSymbol, { color: colors.textSecondary }]}>{coin.symbol.toUpperCase()}</Text>
              </View>
              <Text style={[styles.coinPrice, { color: colors.text }]}>${coin.current_price.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.ashEcosystem}</Text>
          
          <View style={styles.ecoGrid}>
            
            <TouchableOpacity 
              style={[styles.ecoCard, { backgroundColor: colors.card, borderColor: '#fbbf24' }]} 
              onPress={() => Linking.openURL('https://ashcoin-landing.web.app/')}
            >
              <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(251, 191, 36, 0.2)', justifyContent: 'center', alignItems: 'center'}}>
                 <Zap size={24} color="#fbbf24" />
              </View>
              <Text style={[styles.ecoTitle, { color: '#fbbf24', marginTop: 8 }]}>{t.ashStakingApp}</Text>
              <Text style={[styles.ecoStatus, { color: colors.textSecondary }]}>{t.openWebApp}</Text>
            </TouchableOpacity>

            <View style={[styles.ecoCard, styles.ecoCardDev, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Globe size={24} color={colors.textSecondary} />
              <Text style={[styles.ecoTitle, { color: colors.text }]}>{t.ashP2P}</Text>
              <Text style={[styles.ecoStatus, { color: colors.textSecondary }]}>{t.inDevelopment}</Text>
            </View>

            <View style={[styles.ecoCard, styles.ecoCardDev, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ShieldCheck size={24} color={colors.textSecondary} />
              <Text style={[styles.ecoTitle, { color: colors.text }]}>{t.ashBlaze}</Text>
              <Text style={[styles.ecoStatus, { color: colors.textSecondary }]}>{t.inDevelopment}</Text>
            </View>

          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.latestNews}</Text>
          {news.map((item, index) => (
            <View key={index} style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.newsHeader}>
                <Text style={[styles.newsSource, { color: colors.primary }]}>{item.source}</Text>
                <Text style={[styles.newsTime, { color: colors.textSecondary }]}>{item.time}</Text>
              </View>
              <Text style={[styles.newsTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, fontFamily: 'monospace' },
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 }, 
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 14, marginTop: 4 },
  priceCard: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, alignItems: 'center' },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 32, fontWeight: '800', marginVertical: 8 },
  priceSub: { fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  cryptoRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  coinImg: { width: 30, height: 30, borderRadius: 15, marginRight: 12 },
  coinName: { fontSize: 14, fontWeight: '600' },
  coinSymbol: { fontSize: 12 },
  coinPrice: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  ecoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  ecoCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  ecoCardDev: { opacity: 0.6 },
  ecoTitle: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  ecoStatus: { fontSize: 12, marginTop: 4 },
  newsCard: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  newsSource: { fontSize: 12, fontWeight: '700' },
  newsTime: { fontSize: 12 },
  newsTitle: { fontSize: 14, lineHeight: 20 },
});

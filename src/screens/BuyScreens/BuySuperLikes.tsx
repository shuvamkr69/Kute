import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../utils/api';

interface Product {
  id: string;
  name: string;
  price: string;
}

type BuyTab = 'superlikes' | 'boosts';

type RouteParams = {
  initialTab?: BuyTab;
};

const BuyFeaturesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<BuyTab>('superlikes');
  const [superLikeProducts, setSuperLikeProducts] = useState<Product[]>([]);
  const [boostProducts, setBoostProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    // Set initial tab from navigation params
    const params = (route.params || {}) as RouteParams;
    if (params.initialTab === 'boosts') setActiveTab('boosts');
    else setActiveTab('superlikes');
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setSuperLikeProducts(response.data.data.superLikes);
      setBoostProducts(response.data.data.boosts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: Product, type: BuyTab) => {
    try {
      setPurchasing(product.id);
      const purchaseToken = `token_${Date.now()}`;
      const endpoint = type === 'superlikes' ? '/purchase/superlike' : '/purchase/boost';
      await api.post(endpoint, {
        purchaseToken,
        productId: product.id,
      });
      Alert.alert(
        'Success!',
        `Successfully purchased ${product.name}!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'superlikes' && styles.activeTab]}
        onPress={() => setActiveTab('superlikes')}
      >
        <Text style={[styles.tabText, activeTab === 'superlikes' && styles.activeTabText]}>Super Likes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'boosts' && styles.activeTab]}
        onPress={() => setActiveTab('boosts')}
      >
        <Text style={[styles.tabText, activeTab === 'boosts' && styles.activeTabText]}>Boosts</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuperLikes = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.infoSection}>
        <Ionicons name="star" size={48} color="#FF6B6B" />
        <Text style={styles.infoTitle}>Stand Out!</Text>
        <Text style={styles.infoDescription}>
          Super Likes let someone know you're really interested. They'll see a blue star and know you Super Liked them.
        </Text>
      </View>
      <View style={styles.productsContainer}>
        {superLikeProducts.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
            <TouchableOpacity
              style={[styles.buyButton, { marginLeft: 12 }]}
              onPress={() => handlePurchase(product, 'superlikes')}
              disabled={purchasing === product.id}
              activeOpacity={0.9}
            >
              <Text style={styles.buyButtonText}>{purchasing === product.id ? 'Buying...' : 'Buy'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Purchases will be charged to your Google Play account</Text>
      </View>
    </ScrollView>
  );

  const renderBoosts = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.infoSection}>
        <Ionicons name="flash" size={48} color="#FF6B6B" />
        <Text style={styles.infoTitle}>Get More Matches!</Text>
        <Text style={styles.infoDescription}>
          Boosts put your profile at the top of the stack for 30 minutes, increasing your chances of getting matches.
        </Text>
      </View>
      <View style={styles.productsContainer}>
        {boostProducts.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
            <TouchableOpacity
              style={[styles.buyButton, { marginLeft: 12 }]}
              onPress={() => handlePurchase(product, 'boosts')}
              disabled={purchasing === product.id}
              activeOpacity={0.9}
            >
              <Text style={styles.buyButtonText}>{purchasing === product.id ? 'Buying...' : 'Buy'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Purchases will be charged to your Google Play account</Text>
      </View>
      {/* Buy More Boost Button */}
      <TouchableOpacity style={styles.buyMoreButton} onPress={() => setActiveTab('boosts')}>
        <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buyMoreButtonText}>Buy More Boost</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      {renderTabBar()}
      {/* Tab Content */}
      {activeTab === 'superlikes' ? renderSuperLikes() : renderBoosts()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E1E1E',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#de822c',
  },
  tabText: {
    color: '#B0B0B0',
    fontSize: 16,
  },
  activeTabText: {
    color: '#de822c',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  productsContainer: {
    marginTop: 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  buyButton: {
    backgroundColor: '#de822c',
    borderRadius: 8,
    paddingVertical: 6, // smaller height
    paddingHorizontal: 12, // smaller width
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buyMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#de822c',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    marginHorizontal: 40,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buyMoreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BuyFeaturesScreen; 
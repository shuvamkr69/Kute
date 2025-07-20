import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';
import BackButton from '../../components/BackButton';

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
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    // Set initial tab from navigation params
    const params = (route.params || {}) as RouteParams;
    if (params.initialTab === 'boosts') setActiveTab('boosts');
    else setActiveTab('superlikes');
    // Hardcoded INR offers to match ProfileScreen
    setSuperLikeProducts([
      { id: 'sl1', name: '1 Super Like', price: '₹9' },
      { id: 'sl2', name: '5 Super Likes', price: '₹39' },
      { id: 'sl3', name: '15 Super Likes', price: '₹99' },
      { id: 'sl4', name: '30 Super Likes', price: '₹179' },
    ]);
    setBoostProducts([
      { id: 'b1', name: '1 Boost', price: '₹15' },
      { id: 'b2', name: '5 Boosts', price: '₹59' },
      { id: 'b3', name: '10 Boosts', price: '₹109' },
    ]);
  }, []);

  const handlePurchase = async (product: Product, type: BuyTab) => {
    try {
      setPurchasing(product.id);
      const purchaseToken = `token_${Date.now()}`;
      const endpoint = type === 'superlikes' ? '/purchase/superlike' : '/purchase/boost';
      await api.post(endpoint, {
        purchaseToken,
        productId: product.id,
      });
      setCustomAlert({ visible: true, title: 'Success!', message: `Successfully purchased ${product.name}!` });
    } catch (error) {
      console.error('Purchase error:', error);
      setCustomAlert({ visible: true, title: 'Error', message: 'Failed to complete purchase. Please try again.' });
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
              <View style={styles.productInfoRow}>
                <Text style={styles.productName}>{product.name}</Text>
                {product.id === 'sl3' && (
                  <Image
                    source={require('../../assets/icons/most-popular.png')}
                    style={{ width: 28, height: 28, marginLeft: 8 }}
                    resizeMode="contain"
                  />
                )}
              </View>
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
          Boosts put your profile at the top of the stack for 6 hours, increasing your chances of getting matches.
        </Text>
      </View>
      <View style={styles.productsContainer}>
        {boostProducts.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productInfo}>
              <View style={styles.productInfoRow}>
                <Text style={styles.productName}>{product.name}</Text>
                {product.id === 'b3' && (
                  <Image
                    source={require('../../assets/icons/most-popular.png')}
                    style={{ width: 28, height: 28, marginLeft: 8 }}
                    resizeMode="contain"
                  />
                )}
              </View>
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
    <View style={styles.backButtonContainer}>
      <BackButton title="Buy Superlikes and Boosts" />
      <View style={styles.container}>

        {renderTabBar()}
        {activeTab === 'superlikes' ? renderSuperLikes() : renderBoosts()}
        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: '#000',
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
    backgroundColor: '#000',
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#000',
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
    backgroundColor: '#000',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#de822c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  footerText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  buyButton: {
    backgroundColor: '#de822c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
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
  backButtonContainer: {
     flex:1,
     backgroundColor: '#000',
  },
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
});

export default BuyFeaturesScreen; 
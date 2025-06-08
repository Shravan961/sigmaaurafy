import * as React from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge, badgeVariants } from "../../../components/ui/badge";
import { Loader2, Search, ShoppingCart, ExternalLink, Star } from 'lucide-react';
import { toast } from "sonner";
import { GROQ_API_KEY, GROQ_MODEL } from '../../../utils/constants';
import { cn } from "../../../lib/utils";

interface Product {
  name: string;
  description: string;
  price: string;
  store: string;
  url: string;
  rating?: string;
  image?: string;
  availability?: string;
  shipping?: string;
  productId?: string;
  sku?: string;
}

interface EasyShoppingToolProps {
  onSendToChat: (message: string) => void;
}

// Simple hash function for generating product IDs
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 10);
};

export const EasyShoppingTool: React.FC<EasyShoppingToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);

  const generateProductUrl = async (store: string, productName: string, product: Product): Promise<string> => {
    try {
      // First try to use product ID if available
      if (product.productId || product.sku) {
        const id = product.productId || product.sku;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are a product URL expert. Given a store name, product name, and product ID, generate the most accurate direct product URL. Only return the URL, nothing else. Make sure the URL follows the store's actual URL pattern.`
              },
              {
                role: 'user',
                content: `Generate a direct product URL for:\nStore: ${store}\nProduct: ${productName}\nProduct ID: ${id}`
              }
            ],
            temperature: 0.2,
            max_tokens: 100
          })
        });

        if (response.ok) {
          const data = await response.json();
          const url = data.choices[0]?.message?.content?.trim();
          if (url && url.startsWith('http')) {
            return url;
          }
        }
      }

      // If no product ID or the above failed, generate a search URL
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a product URL expert. Given a store name and product name, generate the most accurate search URL that would show this product. Only return the URL, nothing else. Make sure the URL follows the store's actual search URL pattern and includes necessary parameters.`
            },
            {
              role: 'user',
              content: `Generate a search URL for:\nStore: ${store}\nProduct: ${productName}`
            }
          ],
          temperature: 0.2,
          max_tokens: 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        const url = data.choices[0]?.message?.content?.trim();
        if (url && url.startsWith('http')) {
          return url;
        }
      }

      // Fallback to basic search URL if AI generation fails
      const encodedProduct = encodeURIComponent(productName);
      const cleanStoreName = store.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');
      return `https://www.${cleanStoreName}.com/search?q=${encodedProduct}`;
    } catch (error) {
      console.error('Error generating product URL:', error);
      // Fallback to basic search URL
      const encodedProduct = encodeURIComponent(productName);
      const cleanStoreName = store.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');
      return `https://www.${cleanStoreName}.com/search?q=${encodedProduct}`;
    }
  };

  const generateFallbackProducts = async (productName: string): Promise<Product[]> => {
    const productLower = productName.toLowerCase();
    let relevantStores: string[] = [];

    // Determine relevant stores based on product keywords
    if (productLower.includes('phone') || productLower.includes('laptop') || productLower.includes('camera')) {
      relevantStores = ['Amazon', 'Best Buy', 'B&H Photo', 'Newegg'];
    } else if (productLower.includes('clothes') || productLower.includes('shoes') || productLower.includes('dress')) {
      relevantStores = ['ASOS', 'H&M', 'Zara', 'Nordstrom'];
    } else if (productLower.includes('furniture') || productLower.includes('home')) {
      relevantStores = ['IKEA', 'Wayfair', 'Home Depot', 'Target'];
    } else if (productLower.includes('book') || productLower.includes('novel')) {
      relevantStores = ['Amazon', 'Barnes & Noble', 'Books-A-Million', 'ThriftBooks'];
    } else if (productLower.includes('makeup') || productLower.includes('beauty')) {
      relevantStores = ['Sephora', 'Ulta', 'Amazon', 'Target'];
    } else {
      relevantStores = ['Amazon', 'Walmart', 'Target', 'eBay'];
    }

    const basePrice = Math.random() * 50 + 20;
    
    return Promise.all(relevantStores.map(async (store, index) => {
      // Generate a mock product ID based on store and product
      const mockId = simpleHash(`${store}-${productName}-${index}`);
      
      const url = await generateProductUrl(store, productName, { productId: mockId } as Product);
      
      return {
        name: `${productName} - ${store} Selection`,
        description: `High-quality ${productName} available at ${store}. Features vary by model and availability.`,
        price: `$${(basePrice + (index * 5) + Math.random() * 10).toFixed(2)}`,
        store: store,
        productId: mockId,
        url: url,
        rating: `${(Math.random() * 1.5 + 3.5).toFixed(1)}/5`,
        availability: Math.random() > 0.2 ? 'In Stock' : 'Limited Stock',
        shipping: Math.random() > 0.3 ? 'Free Shipping' : `$${(Math.random() * 10 + 5).toFixed(2)} Shipping`
      };
    }));
  };

  const generateProductData = async (productName: string): Promise<Product[]> => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a product research assistant. Generate realistic product listings with names, descriptions, prices, and store information. Consider the type of product when suggesting stores. Return exactly 4 products in JSON format with fields: name, description, price, store, rating, availability, shipping, productId. Make the data realistic and varied across different relevant stores. The productId should be a realistic product identifier for that store's format (e.g., B0123456789 for Amazon, numbers for other stores).`
            },
            {
              role: 'user',
              content: `Generate 4 realistic product listings for: ${productName}. Choose stores that would actually sell this type of product. Make sure each has a unique name, detailed description, realistic price, proper store information, and a realistic product ID for that store's format. Include availability and shipping info.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const products = JSON.parse(jsonMatch[0]);
          const productsWithUrls = await Promise.all(products.map(async (product: Product) => ({
            ...product,
            url: await generateProductUrl(product.store, productName, product)
          })));
          return productsWithUrls;
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }

      return generateFallbackProducts(productName);
    } catch (error) {
      console.error('Error generating product data:', error);
      return generateFallbackProducts(productName);
    }
  };

  const searchProducts = async () => {
    if (!query.trim()) {
      toast.error('Please enter a product to search for');
      return;
    }

    setLoading(true);
    try {
      const productData = await generateProductData(query.trim());
      setProducts(productData);
      
      const summary = `🛒 **Shopping Results for "${query}"**\n\nFound ${productData.length} products:\n${productData.map((p, i) => `${i + 1}. ${p.name} - ${p.price} at ${p.store}`).join('\n')}\n\nClick any product to view on the store website.`;
      onSendToChat(summary);
      
      toast.success(`Found ${productData.length} products for "${query}"`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  };

  const handleProductClick = (product: Product) => {
    window.open(product.url, '_blank');
    onSendToChat(`🛒 Opened ${product.store} link for "${product.name}" - ${product.price}`);
  };

  return (
    <div className="w-96 h-full flex flex-col bg-background border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Smart Shopping Assistant</h2>
        </div>
        
        <div className="flex space-x-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for any product..."
            className="flex-1"
            disabled={loading}
          />
          <Button 
            onClick={searchProducts} 
            disabled={loading || !query.trim()}
            className="px-6"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {products.length > 0 ? (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              {products.map((product, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
                          {product.name}
                        </h3>
                        <div className={cn(badgeVariants({ variant: "secondary" }), "ml-2 shrink-0 text-xs")}>
                          {product.store}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-lg text-primary">{product.price}</span>
                          {product.shipping && (
                            <span className="text-xs text-muted-foreground">{product.shipping}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          {product.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">{product.rating}</span>
                            </div>
                          )}
                          {product.availability && (
                            <span className={`text-xs ${product.availability === 'In Stock' ? 'text-green-500' : 'text-orange-500'}`}>
                              {product.availability}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on {product.store}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-3">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-foreground">Smart Product Search</h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                Enter any product to find the best options across relevant stores
              </p>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Finding the best options...</span>
          </div>
        </div>
      )}
    </div>
  );
};
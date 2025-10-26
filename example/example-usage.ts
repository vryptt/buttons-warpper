
import { 
  sendButtons,
  sendInteractiveMessage,
  createDocumentHeader,
  createImageHeader,
  createVideoHeader,
  createContextInfo,
  createExternalAdReply,
  InteractiveValidationError
} from '../src';

// ==================== EXAMPLE 1: Basic Quick Reply ====================

export async function example01_BasicQuickReply(sock: any, jid: string) {
  console.log('📤 Example 1: Basic Quick Reply Buttons');
  
  try {
    const message = await sendButtons(sock, jid, {
      text: 'Do you like this library?',
      footer: '© 2024 WhatsApp Interactive Buttons',
      buttons: [
        { id: 'yes', text: '👍 Yes' },
        { id: 'no', text: '👎 No' },
        { id: 'maybe', text: '🤔 Maybe' }
      ]
    });
    
    console.log('✅ Message sent:', message.key.id);
    return message;
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}

// ==================== EXAMPLE 2: URL and Copy Buttons ====================

export async function example02_UrlAndCopyButtons(sock: any, jid: string) {
  console.log('📤 Example 2: URL and Copy Buttons');
  
  const message = await sendButtons(sock, jid, {
    text: 'Get your exclusive discount code!',
    footer: 'Offer valid until Dec 31, 2024',
    buttons: [
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🌐 Visit Website',
          url: 'https://example.com/shop',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: '🎟️ Copy Coupon',
          copy_code: 'SAVE50NOW',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_call',
        buttonParamsJson: JSON.stringify({
          display_text: '📞 Call Support',
          phone_number: '+1-800-123-4567',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 3: Single Select List ====================

export async function example03_SingleSelectList(sock: any, jid: string) {
  console.log('📤 Example 3: Single Select List');
  
  const message = await sendButtons(sock, jid, {
    text: 'Choose your favorite programming language',
    footer: 'Select from the list below',
    buttons: [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Programming Languages',
          sections: [
            {
              title: 'Popular Languages',
              highlight_label: '🔥 Trending',
              rows: [
                {
                  header: 'Web Development',
                  title: 'JavaScript',
                  description: 'The language of the web',
                  id: 'lang_javascript'
                },
                {
                  header: 'Backend',
                  title: 'Python',
                  description: 'Simple and powerful',
                  id: 'lang_python'
                },
                {
                  header: 'Mobile',
                  title: 'Kotlin',
                  description: 'Modern Android development',
                  id: 'lang_kotlin'
                }
              ]
            },
            {
              title: 'System Programming',
              highlight_label: '⚡ Performance',
              rows: [
                {
                  title: 'Rust',
                  description: 'Memory safe and blazing fast',
                  id: 'lang_rust'
                },
                {
                  title: 'Go',
                  description: 'Simple, reliable, efficient',
                  id: 'lang_go'
                },
                {
                  title: 'C++',
                  description: 'High performance computing',
                  id: 'lang_cpp'
                }
              ]
            },
            {
              title: 'Functional Languages',
              highlight_label: '🎯 Advanced',
              rows: [
                {
                  title: 'Haskell',
                  description: 'Pure functional programming',
                  id: 'lang_haskell'
                },
                {
                  title: 'Elixir',
                  description: 'Scalable and maintainable',
                  id: 'lang_elixir'
                }
              ]
            }
          ],
          has_multiple_buttons: false
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 4: Document Header ====================

export async function example04_DocumentHeader(sock: any, jid: string) {
  console.log('📤 Example 4: Interactive Message with Document Header');
  
  const message = await sendButtons(sock, jid, {
    text: 'Download our comprehensive guide',
    footer: 'Complete tutorial included',
    
    header: createDocumentHeader(
      'https://mmg.whatsapp.net/v/t62.7119-24/document.enc',
      {
        fileName: 'WhatsApp_Interactive_Buttons_Guide.pdf',
        fileLength: '2500000',
        mimetype: 'application/pdf',
        pageCount: 25
      }
    ),
    
    buttons: [
      { id: 'read', text: '📖 Read Now' },
      { id: 'later', text: '🕐 Read Later' },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🌐 Online Version',
          url: 'https://docs.example.com/guide',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 5: Image Header ====================

export async function example05_ImageHeader(sock: any, jid: string) {
  console.log('📤 Example 5: Interactive Message with Image Header');
  
  const message = await sendButtons(sock, jid, {
    text: 'Check out our new product launch! 🚀',
    footer: 'Limited stock available',
    
    header: createImageHeader(
      'https://example.com/product-image.jpg',
      {
        caption: 'New Product 2024',
        mimetype: 'image/jpeg'
      }
    ),
    
    buttons: [
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🛒 Buy Now',
          url: 'https://shop.example.com/new-product',
          has_multiple_buttons: true
        })
      },
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Choose Size',
          sections: [{
            title: 'Available Sizes',
            rows: [
              { title: 'Small', description: 'S', id: 'size_s' },
              { title: 'Medium', description: 'M', id: 'size_m' },
              { title: 'Large', description: 'L', id: 'size_l' },
              { title: 'Extra Large', description: 'XL', id: 'size_xl' }
            ]
          }],
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 6: Video Header ====================

export async function example06_VideoHeader(sock: any, jid: string) {
  console.log('📤 Example 6: Interactive Message with Video Header');
  
  const message = await sendButtons(sock, jid, {
    text: 'Watch our latest tutorial video',
    footer: 'Duration: 15:30 minutes',
    
    header: createVideoHeader(
      'https://example.com/tutorial-video.mp4',
      {
        caption: 'Complete Tutorial - Getting Started',
        mimetype: 'video/mp4'
      }
    ),
    
    buttons: [
      { id: 'like', text: '👍 Like' },
      { id: 'share', text: '↗️ Share' },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '📺 Watch on YouTube',
          url: 'https://youtube.com/watch?v=example',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 7: With Mentions ====================

export async function example07_WithMentions(sock: any, jid: string, mentionJids: string[]) {
  console.log('📤 Example 7: Interactive Message with Mentions');
  
  const message = await sendButtons(sock, jid, {
    text: `Hey @${mentionJids[0].split('@')[0]}, check this out! 👋`,
    footer: 'Tagged message',
    
    contextInfo: createContextInfo(mentionJids),
    
    buttons: [
      { id: 'seen', text: '👀 Seen' },
      { id: 'reply', text: '💬 Reply' }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 8: External Ad Reply ====================

export async function example08_ExternalAdReply(sock: any, jid: string) {
  console.log('📤 Example 8: Interactive Message with External Ad Reply');
  
  const message = await sendButtons(sock, jid, {
    text: 'Check out our amazing deals!',
    footer: 'Limited time offer',
    
    contextInfo: createContextInfo(
      [],
      {
        title: 'Flash Sale 🔥',
        body: 'Up to 70% OFF on selected items',
        thumbnailUrl: 'https://example.com/flash-sale-banner.jpg',
        sourceUrl: 'https://shop.example.com/flash-sale',
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true
      }
    ),
    
    buttons: [
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🛍️ Shop Now',
          url: 'https://shop.example.com/flash-sale',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: '🎁 Copy Code',
          copy_code: 'FLASH70',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 9: Complete Advanced Message ====================

export async function example09_CompleteAdvanced(sock: any, jid: string) {
  console.log('📤 Example 9: Complete Advanced Interactive Message');
  
  const message = await sendButtons(sock, jid, {
    text: null, // No body text
    footer: 'Select your preferred option below',
    
    // Document header
    header: createDocumentHeader(
      'https://mmg.whatsapp.net/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc',
      {
        fileName: 'Product_Catalog_2024.pdf',
        fileLength: '999999999999',
        mimetype: 'application/pdf',
        pageCount: 50
      }
    ),
    
    // Context info with mentions and external ad
    contextInfo: createContextInfo(
      [jid],
      {
        title: 'Premium Membership',
        body: 'Join now and get exclusive benefits',
        thumbnailUrl: 'https://example.com/premium-badge.jpg',
        sourceUrl: 'https://example.com/premium',
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true
      }
    ),
    
    // Message parameters
    messageParams: {
      limited_time_offer: {
        text: 'Special offer ends in 24 hours!',
        url: 'https://example.com/limited-offer',
        copy_code: 'LIMITED24',
        expiration_time: Date.now() + (24 * 60 * 60 * 1000)
      },
      bottom_sheet: {
        in_thread_buttons_limit: 3,
        divider_indices: [1, 2, 3, 4, 5],
        list_title: 'Choose your plan',
        button_title: 'Select Plan'
      },
      tap_target_configuration: {
        title: 'Get Started',
        description: 'Select your membership tier',
        canonical_url: 'https://example.com/membership',
        domain: 'example.com',
        button_index: 0
      }
    },
    
    // Multiple buttons with various types
    buttons: [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Membership Plans',
          sections: [
            {
              title: 'Standard Plans',
              highlight_label: '💎 Popular',
              rows: [
                {
                  header: 'Monthly',
                  title: 'Basic Plan',
                  description: '$9.99/month - 100GB storage',
                  id: 'plan_basic_monthly'
                },
                {
                  header: 'Monthly',
                  title: 'Pro Plan',
                  description: '$19.99/month - 500GB storage',
                  id: 'plan_pro_monthly'
                },
                {
                  header: 'Monthly',
                  title: 'Premium Plan',
                  description: '$29.99/month - Unlimited storage',
                  id: 'plan_premium_monthly'
                }
              ]
            },
            {
              title: 'Annual Plans',
              highlight_label: '🎉 Save 30%',
              rows: [
                {
                  header: 'Yearly',
                  title: 'Basic Plan',
                  description: '$99.99/year - Save $20',
                  id: 'plan_basic_yearly'
                },
                {
                  header: 'Yearly',
                  title: 'Pro Plan',
                  description: '$199.99/year - Save $40',
                  id: 'plan_pro_yearly'
                },
                {
                  header: 'Yearly',
                  title: 'Premium Plan',
                  description: '$299.99/year - Save $60',
                  id: 'plan_premium_yearly'
                }
              ]
            },
            {
              title: 'Enterprise',
              highlight_label: '🏢 Business',
              rows: [
                {
                  title: 'Team Plan',
                  description: 'Up to 10 users - Custom pricing',
                  id: 'plan_team'
                },
                {
                  title: 'Enterprise Plan',
                  description: 'Unlimited users - Contact sales',
                  id: 'plan_enterprise'
                }
              ]
            }
          ],
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🌐 View Full Details',
          url: 'https://example.com/pricing',
          merchant_url: 'https://example.com',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: '🎟️ Copy Discount Code',
          copy_code: 'WELCOME50',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_call',
        buttonParamsJson: JSON.stringify({
          display_text: '📞 Call Sales Team',
          phone_number: '+1-800-EXAMPLE',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 10: E-Commerce Product ====================

export async function example10_EcommerceProduct(sock: any, jid: string) {
  console.log('📤 Example 10: E-Commerce Product Showcase');
  
  const message = await sendButtons(sock, jid, {
    text: '🎧 Premium Wireless Headphones\n\n' +
          '✨ Features:\n' +
          '• Active Noise Cancellation\n' +
          '• 30-hour battery life\n' +
          '• Hi-Res Audio certified\n' +
          '• Bluetooth 5.3\n\n' +
          '💰 Price: $299.99\n' +
          '🔥 Limited stock available!',
    footer: 'Free shipping on orders over $50',
    
    header: createImageHeader(
      'https://example.com/headphones-product.jpg',
      {
        caption: 'Premium Wireless Headphones',
        mimetype: 'image/jpeg'
      }
    ),
    
    contextInfo: createContextInfo(
      [],
      {
        title: 'Best Seller 2024',
        body: '⭐⭐⭐⭐⭐ 4.8/5 (2,341 reviews)',
        thumbnailUrl: 'https://example.com/bestseller-badge.png',
        sourceUrl: 'https://shop.example.com/headphones',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    ),
    
    messageParams: {
      limited_time_offer: {
        text: '⏰ Flash Sale ends in 6 hours!',
        copy_code: 'FLASH20',
        expiration_time: Date.now() + (6 * 60 * 60 * 1000)
      },
      bottom_sheet: {
        in_thread_buttons_limit: 2,
        list_title: 'Choose your options',
        button_title: 'Customize'
      }
    },
    
    buttons: [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Select Options',
          sections: [
            {
              title: 'Colors',
              highlight_label: '🎨 Available',
              rows: [
                { title: 'Matte Black', description: 'Classic & elegant', id: 'color_black' },
                { title: 'Silver Grey', description: 'Modern & sleek', id: 'color_silver' },
                { title: 'Rose Gold', description: 'Premium finish', id: 'color_rose' },
                { title: 'Navy Blue', description: 'Bold & stylish', id: 'color_navy' }
              ]
            },
            {
              title: 'Warranty',
              rows: [
                { title: 'Standard (1 Year)', description: 'Free - Manufacturer warranty', id: 'warranty_1' },
                { title: 'Extended (2 Years)', description: '+$29.99 - Additional coverage', id: 'warranty_2' },
                { title: 'Premium (3 Years)', description: '+$49.99 - Full protection', id: 'warranty_3' }
              ]
            },
            {
              title: 'Accessories',
              highlight_label: '🎁 Bundle',
              rows: [
                { title: 'Carrying Case', description: '+$19.99 - Hard shell case', id: 'acc_case' },
                { title: 'Extra Cushions', description: '+$9.99 - Memory foam', id: 'acc_cushions' },
                { title: 'Audio Cable', description: '+$14.99 - Premium 3.5mm', id: 'acc_cable' }
              ]
            }
          ],
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🛒 Add to Cart',
          url: 'https://shop.example.com/cart/add/headphones',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: '🎟️ Apply Coupon',
          copy_code: 'FLASH20',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 11: Restaurant Menu ====================

export async function example11_RestaurantMenu(sock: any, jid: string) {
  console.log('📤 Example 11: Restaurant Menu');
  
  const message = await sendButtons(sock, jid, {
    text: '🍽️ Welcome to Gourmet Paradise!\n\n' +
          'Browse our delicious menu and place your order.',
    footer: '⏰ Open: 10 AM - 11 PM | 🚚 Free delivery over $30',
    
    header: createImageHeader(
      'https://example.com/restaurant-banner.jpg',
      {
        caption: 'Gourmet Paradise Restaurant',
        mimetype: 'image/jpeg'
      }
    ),
    
    messageParams: {
      bottom_sheet: {
        in_thread_buttons_limit: 2,
        list_title: 'Select from menu',
        button_title: 'Order Now'
      }
    },
    
    buttons: [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Menu Categories',
          sections: [
            {
              title: 'Appetizers',
              highlight_label: '🥗 Fresh',
              rows: [
                { title: 'Caesar Salad', description: '$8.99 - Classic with parmesan', id: 'app_caesar' },
                { title: 'Spring Rolls', description: '$6.99 - Crispy & fresh (4 pcs)', id: 'app_spring' },
                { title: 'Soup of the Day', description: '$5.99 - Chef\'s special', id: 'app_soup' }
              ]
            },
            {
              title: 'Main Courses',
              highlight_label: '⭐ Popular',
              rows: [
                { title: 'Grilled Salmon', description: '$24.99 - With vegetables', id: 'main_salmon' },
                { title: 'Ribeye Steak', description: '$32.99 - 12oz premium cut', id: 'main_steak' },
                { title: 'Vegetarian Pasta', description: '$16.99 - Fresh ingredients', id: 'main_pasta' },
                { title: 'Chicken Teriyaki', description: '$18.99 - Japanese style', id: 'main_teriyaki' }
              ]
            },
            {
              title: 'Desserts',
              highlight_label: '🍰 Sweet',
              rows: [
                { title: 'Tiramisu', description: '$7.99 - Italian classic', id: 'dess_tiramisu' },
                { title: 'Chocolate Lava Cake', description: '$8.99 - Warm & gooey', id: 'dess_lava' },
                { title: 'Ice Cream Sundae', description: '$6.99 - 3 scoops', id: 'dess_sundae' }
              ]
            },
            {
              title: 'Beverages',
              rows: [
                { title: 'Fresh Juices', description: '$4.99 - Orange/Apple/Mix', id: 'bev_juice' },
                { title: 'Soft Drinks', description: '$2.99 - Coke/Sprite/Fanta', id: 'bev_soda' },
                { title: 'Coffee/Tea', description: '$3.99 - Hot or iced', id: 'bev_coffee' }
              ]
            },
            {
              title: 'Special Combos',
              highlight_label: '💰 Deal',
              rows: [
                { title: 'Lunch Combo', description: '$19.99 - Main + Side + Drink', id: 'combo_lunch' },
                { title: 'Dinner for Two', description: '$54.99 - 2 Mains + 2 Sides + Dessert', id: 'combo_dinner' },
                { title: 'Family Feast', description: '$89.99 - Feeds 4-5 people', id: 'combo_family' }
              ]
            }
          ],
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🍕 Order Online',
          url: 'https://restaurant.example.com/order',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_call',
        buttonParamsJson: JSON.stringify({
          display_text: '📞 Call to Order',
          phone_number: '+1-555-FOOD-NOW',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}

// ==================== EXAMPLE 12: Event Registration ====================

export async function example12_EventRegistration(sock: any, jid: string) {
  console.log('📤 Example 12: Event Registration');
  
  const message = await sendButtons(sock, jid, {
    text: '🎉 Tech Conference 2024\n\n' +
          '📅 Date: December 15-17, 2024\n' +
          '📍 Location: Convention Center, San Francisco\n' +
          '👥 Expected Attendees: 5,000+\n\n' +
          '🎤 Featured Speakers:\n' +
          '• John Doe - CEO of TechCorp\n' +
          '• Jane Smith - AI Research Lead\n' +
          '• Mike Johnson - Cloud Architect\n\n' +
          '🎟️ Register now and get early bird discount!',
    footer: 'Limited seats available',
    
    header: createDocumentHeader(
      'https://example.com/conference-agenda.pdf',
      {
        fileName: 'Tech_Conference_2024_Agenda.pdf',
        fileLength: '3500000',
        mimetype: 'application/pdf',
        pageCount: 15
      }
    ),
    
    contextInfo: createContextInfo(
      [],
      {
        title: 'Tech Conference 2024',
        body: 'Join the biggest tech event of the year',
        thumbnailUrl: 'https://example.com/conference-banner.jpg',
        sourceUrl: 'https://conference.example.com',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    ),
    
    messageParams: {
      limited_time_offer: {
        text: '⏰ Early Bird: Save 40% - Ends Nov 30',
        copy_code: 'EARLYBIRD40',
        expiration_time: new Date('2024-11-30').getTime()
      },
      bottom_sheet: {
        in_thread_buttons_limit: 2,
        list_title: 'Select your pass',
        button_title: 'Register'
      }
    },
    
    buttons: [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Conference Passes',
          sections: [
            {
              title: 'Individual Passes',
              highlight_label: '🎫 Standard',
              rows: [
                {
                  title: 'One Day Pass',
                  description: '$199 - Access to one day (Choose date)',
                  id: 'pass_1day'
                },
                {
                  title: 'Full Conference Pass',
                  description: '$499 - All 3 days access',
                  id: 'pass_full'
                },
                {
                  title: 'VIP Pass',
                  description: '$999 - Full access + VIP lounge + Workshops',
                  id: 'pass_vip'
                }
              ]
            },
            {
              title: 'Group Passes',
              highlight_label: '👥 Team',
              rows: [
                {
                  title: 'Team Pass (5 people)',
                  description: '$2,199 - Save $300',
                  id: 'pass_team5'
                },
                {
                  title: 'Corporate Pass (10 people)',
                  description: '$3,999 - Save $1,000',
                  id: 'pass_corp10'
                }
              ]
            },
            {
              title: 'Workshop Add-ons',
              rows: [
                {
                  title: 'AI & Machine Learning',
                  description: '+$149 - Hands-on workshop',
                  id: 'workshop_ai'
                },
                {
                  title: 'Cloud Architecture',
                  description: '+$149 - Deep dive session',
                  id: 'workshop_cloud'
                },
                {
                  title: 'Cybersecurity',
                  description: '+$149 - Security best practices',
                  id: 'workshop_security'
                }
              ]
            }
          ],
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '🎟️ Register Now',
          url: 'https://conference.example.com/register',
          has_multiple_buttons: true
        })
      },
      {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: '🎁 Copy Promo Code',
          copy_code: 'EARLYBIRD40',
          has_multiple_buttons: true
        })
      }
    ]
  });
  
  console.log('✅ Message sent:', message.key.id);
  return message;
}
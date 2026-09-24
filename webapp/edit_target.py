import re

file_path = '/Users/macbook/devs/cgpa-whatsapp-bot/webapp/src/app/dashboard/target/TargetClient.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add import
if 'usePaystackPayment' not in content:
    content = content.replace("import { useState } from 'react'", "import { useState } from 'react'\nimport { usePaystackPayment } from 'react-paystack'")

# Inject paystack logic
paystack_logic = """
  const config = {
    reference: (new Date()).getTime().toString(),
    email: "student@example.com", // Replace with actual user email when available
    amount: 2000 * 100, // 2000 NGN in kobo
    publicKey: 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY', // Replace with your actual public key
    metadata: {
      custom_fields: [
        {
          display_name: "App Name",
          variable_name: "app_name",
          value: "mygpa"
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    console.log('Payment successful. Reference:', reference);
    alert('Payment of ₦2000 received for MyGPA!');
  };

  const onClose = () => {
    console.log('Payment popup closed');
  };
"""

# Insert logic at start of component
if 'usePaystackPayment(config)' not in content:
    content = content.replace(
        '  const [targetCGPA, setTargetCGPA] = useState<number | \'\'>(\'\')',
        paystack_logic + '\n  const [targetCGPA, setTargetCGPA] = useState<number | \'\'>(\'\')'
    )

# Insert button
paystack_button = """
        {/* Premium Upgrade Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => { initializePayment(onSuccess as any, onClose) }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all hover:scale-105"
          >
            Upgrade to Premium Tracker (₦2,000)
          </button>
        </div>
"""

if 'Upgrade to Premium Tracker' not in content:
    content = content.replace(
        '      </div>\n    </div>\n  )\n}',
        paystack_button + '\n      </div>\n    </div>\n  )\n}'
    )

with open(file_path, 'w') as f:
    f.write(content)

print("Done")

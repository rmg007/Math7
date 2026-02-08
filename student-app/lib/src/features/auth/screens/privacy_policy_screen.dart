import 'package:flutter/material.dart';
import 'package:student_app/src/core/theme/app_theme.dart';

/// Screen displaying the Privacy Policy
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Privacy Policy',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Last updated: February 2026',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 24),
            _buildSection(
              context,
              '1. Introduction',
              'Questerix ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.',
            ),
            _buildSection(
              context,
              '2. Information We Collect',
              'We collect information that you provide directly to us, including:\n\n• Email address (for account authentication)\n• Date of birth (for age verification and COPPA compliance)\n• Learning progress and performance data\n• Device information and usage statistics',
            ),
            _buildSection(
              context,
              '3. How We Use Your Information',
              'We use the information we collect to:\n\n• Provide, maintain, and improve our services\n• Authenticate your account and prevent fraud\n• Track your learning progress and personalize your experience\n• Communicate with you about updates and features\n• Comply with legal obligations, including COPPA requirements',
            ),
            _buildSection(
              context,
              '4. COPPA Compliance',
              'Questerix complies with the Children\'s Online Privacy Protection Act (COPPA). For users under 13:\n\n• We require verifiable parental consent before collecting personal information\n• We only collect information necessary for the app\'s functionality\n• Parents can review, delete, or refuse further collection of their child\'s information',
            ),
            _buildSection(
              context,
              '5. Data Sharing and Disclosure',
              'We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:\n\n• With your consent\n• To comply with legal obligations\n• To protect our rights and prevent fraud\n• With service providers who assist in operating our app (under strict confidentiality agreements)',
            ),
            _buildSection(
              context,
              '6. Data Security',
              'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
            ),
            _buildSection(
              context,
              '7. Data Retention',
              'We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.',
            ),
            _buildSection(
              context,
              '8. Your Rights',
              'You have the right to:\n\n• Access your personal information\n• Correct inaccurate data\n• Request deletion of your data\n• Withdraw consent for data processing\n• Export your data in a portable format',
            ),
            _buildSection(
              context,
              '9. Changes to This Policy',
              'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
            ),
            _buildSection(
              context,
              '10. Contact Us',
              'If you have questions or concerns about this Privacy Policy, please contact us through the app support channels.',
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:student_app/src/core/theme/app_theme.dart';

/// Screen displaying the Terms of Service
class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terms of Service'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Terms of Service',
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
              '1. Acceptance of Terms',
              'By accessing and using Questerix, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this application.',
            ),
            _buildSection(
              context,
              '2. Use License',
              'Permission is granted to temporarily use Questerix for personal, non-commercial educational purposes only. This license shall automatically terminate if you violate any of these restrictions.',
            ),
            _buildSection(
              context,
              '3. User Accounts',
              'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.',
            ),
            _buildSection(
              context,
              '4. User Conduct',
              'You agree to use the app for educational purposes only. You may not use the app to:\n• Violate any applicable laws or regulations\n• Infringe on the rights of others\n• Transmit any harmful or malicious code\n• Attempt to gain unauthorized access to the system',
            ),
            _buildSection(
              context,
              '5. Intellectual Property',
              'All content, features, and functionality of Questerix are owned by Questerix and are protected by international copyright, trademark, and other intellectual property laws.',
            ),
            _buildSection(
              context,
              '6. Disclaimer',
              'Questerix is provided "as is" without any warranties, expressed or implied. We do not guarantee that the app will be error-free or uninterrupted.',
            ),
            _buildSection(
              context,
              '7. Limitation of Liability',
              'In no event shall Questerix be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the application.',
            ),
            _buildSection(
              context,
              '8. Changes to Terms',
              'We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.',
            ),
            _buildSection(
              context,
              '9. Contact Information',
              'If you have any questions about these Terms of Service, please contact us through the app support channels.',
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

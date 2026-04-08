import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { usePayments } from '@/features/payments/usePayments';
import { useStorage } from '@/hooks/useStorage';
import { useSocietyStore } from '@/store/societyStore';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Info, Receipt, ShieldCheck, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PaymentScreen() {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { activeSociety } = useSocietyStore();
  const { submitPayment } = usePayments();
  const { uploadImage } = useStorage();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!activeSociety) {
      Alert.alert('Error', 'Please select a society first');
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      let proofUrl = '';
      if (image) {
        proofUrl = await uploadImage(image);
      }

      await submitPayment.mutateAsync({
        amount: Number(amount),
        note,
        proofUrl,
      });

      Alert.alert('Success', 'Payment submitted for approval');
      setAmount('');
      setNote('');
      setImage(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-8">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-1">Society</Text>
          <Text className="text-4xl font-black text-slate-900">Contributions</Text>
          
          <View className="bg-primary/5 p-4 rounded-2xl mt-6 border border-primary/10 flex-row items-center">
            <ShieldCheck size={20} color="#10b981" />
            <Text className="text-slate-600 font-bold ml-3 flex-1">
              Paying to: <Text className="text-primary font-black">{activeSociety?.name || 'Select a Community'}</Text>
            </Text>
          </View>
        </View>

        <View className="px-6">
          <Card className="p-8 border-0 shadow-2xl shadow-slate-200 rounded-[40px]">
            <View className="flex-row items-center mb-8">
              <View className="bg-secondary/10 p-3 rounded-2xl mr-4">
                <Receipt size={24} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-xl font-black text-slate-800">New Payment</Text>
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fill details below</Text>
              </View>
            </View>

            <Input
              label="Amount (PKR)"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              className="mb-6"
            />

            <Input
              label="Reference Note"
              placeholder="e.g. March Maintenance"
              value={note}
              onChangeText={setNote}
              className="mb-8"
            />

            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">
              Proof of Transfer
            </Text>
            
            {image ? (
              <View className="relative mb-8 rounded-[32px] overflow-hidden border-2 border-slate-50 shadow-sm">
                <Image
                  source={{ uri: image }}
                  className="w-full h-56"
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  className="absolute top-4 right-4 bg-black/50 p-3 rounded-full"
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[32px] items-center mb-8"
              >
                <View className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                  <Camera size={32} color="#94a3b8" />
                </View>
                <Text className="text-slate-400 font-bold text-base">
                  Upload Screenshot
                </Text>
                <Text className="text-slate-300 text-xs mt-1">PNG, JPG up to 5MB</Text>
              </TouchableOpacity>
            )}

            <View className="bg-slate-50/80 p-5 rounded-2xl mb-8 flex-row items-start border border-slate-100">
              <Info size={16} color="#94a3b8" />
              <Text className="text-slate-400 text-xs ml-3 flex-1 leading-5 font-medium">
                Payments are reviewed by society admins. Once verified, the amount will be added to the society's balance.
              </Text>
            </View>

            <Button
              title="Submit for Approval"
              onPress={handleSubmit}
              loading={loading}
              className="h-16 rounded-2xl shadow-xl shadow-primary/30"
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

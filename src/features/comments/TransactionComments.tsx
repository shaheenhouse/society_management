import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTransactionComments } from '@/features/comments/useTransactionComments';
import { MessageCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';

interface TransactionCommentsProps {
  referenceType?: string;
  referenceId?: string;
}

export const TransactionComments = ({ referenceType, referenceId }: TransactionCommentsProps) => {
  const [comment, setComment] = useState('');
  const { comments, addComment } = useTransactionComments(referenceType, referenceId);

  if (!referenceType || !referenceId) return null;

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync(comment);
      setComment('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to add comment');
    }
  };

  return (
    <View className="mt-4 pt-4 border-t border-slate-100">
      <View className="flex-row items-center mb-3">
        <MessageCircle size={14} color="#94a3b8" />
        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-2">
          Public Audit Comments
        </Text>
      </View>

      {comments.slice(0, 3).map((item: any) => (
        <View key={item.id} className="bg-slate-50 rounded-xl p-3 mb-2">
          <Text className="text-slate-700 text-xs font-bold">{item.profiles?.name || 'Member'}</Text>
          <Text className="text-slate-500 text-xs mt-1">{item.comment}</Text>
        </View>
      ))}

      <Input
        value={comment}
        onChangeText={setComment}
        placeholder="Write a public audit comment..."
        className="mb-2"
      />
      <Button
        title="Post Comment"
        variant="outline"
        className="h-11"
        onPress={handleAddComment}
        loading={addComment.isPending}
      />
    </View>
  );
};

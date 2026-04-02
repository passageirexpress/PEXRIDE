import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../FirebaseProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Globe, User, Shield, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  translatedText?: string;
  createdAt: any;
}

interface ChatProps {
  chatId: string;
  recipientName: string;
  recipientRole: string;
  targetLanguage?: string;
}

export default function Chat({ chatId, recipientName, recipientRole, targetLanguage = 'en' }: ChatProps) {
  const { user, profile } = useFirebase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const textToSend = newMessage;
    setNewMessage('');

    try {
      const messageData: any = {
        chatId,
        senderId: user.uid,
        senderName: user.displayName || profile?.displayName || 'User',
        text: textToSend,
        createdAt: Timestamp.now()
      };

      // Add to Firestore
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      // Trigger translation if needed (usually handled by backend, but we do it here for now)
      if (profile?.language && profile.language !== targetLanguage) {
        translateAndSave(chatId, textToSend, targetLanguage);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const translateAndSave = async (chatId: string, text: string, targetLang: string) => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: targetLang })
      });
      if (res.ok) {
        const data = await res.json();
        // We could update the message in Firestore here, but usually the recipient would translate it on their end if needed
        // or the backend function would have done it.
      }
    } catch (err) {
      console.error('Translation error:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-pex-blue text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pex-gold/20 flex items-center justify-center border border-pex-gold/30">
            {recipientRole === 'admin' ? <Shield size={20} className="text-pex-gold" /> : 
             recipientRole === 'driver' ? <Car size={20} className="text-pex-gold" /> : 
             <User size={20} className="text-pex-gold" />}
          </div>
          <div>
            <div className="font-bold text-sm">{recipientName}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">{recipientRole}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded-full">
          <Globe size={12} className="text-pex-gold" />
          Auto-Translate: {targetLanguage.toUpperCase()}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                  isMe ? 'bg-pex-blue text-white rounded-tr-none' : 'bg-white text-pex-blue border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                  {msg.translatedText && (
                    <div className={`mt-2 pt-2 border-t text-xs italic ${isMe ? 'border-white/20 text-white/70' : 'border-gray-100 text-gray-400'}`}>
                      <Globe size={10} className="inline mr-1" />
                      {msg.translatedText}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 px-1">
                  {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-50 border-none focus-visible:ring-pex-gold"
        />
        <Button type="submit" className="bg-pex-gold text-pex-blue hover:bg-pex-blue hover:text-white transition-all">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}

import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

const FAQ_ITEMS = [
  {
    q: "Come funziona la messaggistica anonima?",
    a: "Non è richiesto nessun numero di telefono o email. Ti viene assegnato un ID anonimo unico che puoi condividere con chi vuoi. Solo chi conosce il tuo ID può trovarti e contattarti.",
  },
  {
    q: "I messaggi sono sicuri?",
    a: "Tutti i messaggi sono crittografati end-to-end. Solo tu e il destinatario potete leggere i messaggi. Nemmeno noi possiamo accedere al contenuto delle tue conversazioni.",
  },
  {
    q: "Come aggiungo un contatto?",
    a: "Vai nella schermata Chat, tocca il pulsante + in alto a destra, poi 'Aggiungi Contatto'. Inserisci l'ID anonimo o il nome utente della persona che vuoi aggiungere.",
  },
  {
    q: "Posso cambiare il mio ID anonimo?",
    a: "Sì, puoi resettare la tua identità nelle Impostazioni. Questo genererà un nuovo ID anonimo. Attenzione: i tuoi contatti dovranno usare il nuovo ID per trovarti.",
  },
  {
    q: "Come funzionano i messaggi vocali?",
    a: "Tocca l'icona del microfono nella barra di input per registrare un messaggio vocale. Premi il pulsante rosso per cancellare o il pulsante di invio per mandarlo.",
  },
  {
    q: "Posso inviare foto e video?",
    a: "Sì! Tocca il pulsante + accanto alla barra dei messaggi per allegare foto dalla galleria, scattare con la fotocamera, registrare video o inviare documenti.",
  },
  {
    q: "Cosa succede se blocco qualcuno?",
    a: "I contatti bloccati non potranno inviarti messaggi, chiamarti o vedere il tuo stato online e ultimo accesso. Puoi sbloccarli in qualsiasi momento dalle Impostazioni > Contatti Bloccati.",
  },
  {
    q: "Come funzionano le conferme di lettura?",
    a: "Le doppie spunte indicano che il messaggio è stato consegnato. Quando diventano colorate significano che il messaggio è stato letto. Puoi disattivare le conferme di lettura nelle Impostazioni > Privacy.",
  },
  {
    q: "I miei dati vengono salvati?",
    a: "I tuoi dati sono salvati localmente sul tuo dispositivo. Non vengono caricati su server esterni. Se cancelli l'app, i dati andranno persi.",
  },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Ionicons name="help-buoy" size={56} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Aiuto & FAQ</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Domande frequenti sulla piattaforma
        </Text>
      </View>

      <View style={styles.faqList}>
        {FAQ_ITEMS.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => setExpanded(expanded === index ? null : index)}
            style={[
              styles.faqItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.q}</Text>
              <Ionicons
                name={expanded === index ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textMuted}
              />
            </View>
            {expanded === index && (
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.a}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Anonymous Chat v1.0.0
        </Text>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Realizzata con Expo SDK 57
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14 },
  faqList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 4,
  },
  footerText: { fontSize: 12 },
});

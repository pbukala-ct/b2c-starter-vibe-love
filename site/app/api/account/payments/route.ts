import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCustomObject, upsertCustomObject } from '@/lib/ct/custom-objects';

const CONTAINER = 'customer-payment-methods';

interface StoredCard {
  id: string;
  cardholderName: string;
  last4: string;
  brand: string;
  expiry: string;
  token: string;
  isDefault: boolean;
}

async function getCustomerId() {
  const session = await getSession();
  return session.customerId || null;
}

async function loadCards(customerId: string): Promise<StoredCard[]> {
  const obj = await getCustomObject(CONTAINER, customerId);
  return (obj?.value?.cards as StoredCard[]) || [];
}

async function saveCards(customerId: string, cards: StoredCard[]) {
  await upsertCustomObject(CONTAINER, customerId, { cards });
}

export async function GET() {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const cards = await loadCards(customerId);
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { cardholderName, last4, brand, expiry } = await req.json();

  const cards = await loadCards(customerId);
  const token = `tok_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  const newCard: StoredCard = {
    id: `card_${Date.now()}`,
    cardholderName,
    last4,
    brand,
    expiry,
    token,
    isDefault: cards.length === 0,
  };
  const updated = [...cards, newCard];
  await saveCards(customerId, updated);
  return NextResponse.json({ cards: updated });
}

export async function DELETE(req: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { cardId } = await req.json();
  let cards = await loadCards(customerId);
  cards = cards.filter((c) => c.id !== cardId);
  if (cards.length > 0 && !cards.some((c) => c.isDefault)) {
    cards[0].isDefault = true;
  }
  await saveCards(customerId, cards);
  return NextResponse.json({ cards });
}

export async function PATCH(req: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { cardId } = await req.json();
  const cards = (await loadCards(customerId)).map((c) => ({ ...c, isDefault: c.id === cardId }));
  await saveCards(customerId, cards);
  return NextResponse.json({ cards });
}

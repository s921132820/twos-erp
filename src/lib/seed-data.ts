import type { ShippingOrder } from "./shipping-types";
import { loadData, saveData } from "./storage";

const SEED_FLAG = "erp.seeded.v1";

export function seedDummyDataOnce() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG)) return;

  // Clients
  if (loadData("erp.clients", []).length === 0) {
    saveData("erp.clients", [
      {
        id: crypto.randomUUID(),
        name: "(주)한빛상사",
        businessNumber: "123-45-67890",
        contact: "김영수",
        phone: "02-555-1234",
        address: "서울시 강남구 테헤란로 123",
        memo: "주요 거래처",
      },
      {
        id: crypto.randomUUID(),
        name: "대명물산",
        businessNumber: "211-87-65432",
        contact: "박지민",
        phone: "031-888-2222",
        address: "경기도 성남시 분당구 판교로 200",
        memo: "월 2회 정기 발주",
      },
      {
        id: crypto.randomUUID(),
        name: "유진트레이딩",
        businessNumber: "305-12-34567",
        contact: "이수진",
        phone: "051-777-9090",
        address: "부산광역시 해운대구 센텀로 45",
        memo: "착불 거래",
      },
    ]);
  }

  // Items
  if (loadData("erp.items", []).length === 0) {
    saveData("erp.items", [
      { id: crypto.randomUUID(), code: "IT-001", name: "A4 복사용지", category: "사무용품", unit: "BOX", price: 18000, memo: "500매 5권" },
      { id: crypto.randomUUID(), code: "IT-002", name: "볼펜 검정", category: "사무용품", unit: "EA", price: 500, memo: "" },
      { id: crypto.randomUUID(), code: "IT-003", name: "토너 카트리지", category: "소모품", unit: "EA", price: 89000, memo: "HP 호환" },
      { id: crypto.randomUUID(), code: "IT-004", name: "포장 박스 중", category: "포장재", unit: "EA", price: 1200, memo: "400x300x250" },
      { id: crypto.randomUUID(), code: "IT-005", name: "에어캡", category: "포장재", unit: "ROLL", price: 25000, memo: "1.2m x 50m" },
    ]);
  }

  // Shipping orders
  if (loadData<ShippingOrder[]>("erp.shipping.orders", []).length === 0) {
    const now = Date.now();
    const seedOrders: ShippingOrder[] = [
      {
        id: crypto.randomUUID(),
        createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
        recipientName: "홍길동",
        zipCode: "06236",
        address: "서울시 강남구 역삼동 123-45",
        phone: "02-1234-5678",
        mobile: "010-1111-2222",
        quantity: 1,
        itemName: "A4 복사용지",
        message: "문 앞에 놓아주세요",
        freightType: "선불",
      },
      {
        id: crypto.randomUUID(),
        createdAt: new Date(now - 1000 * 60 * 60).toISOString(),
        recipientName: "김민지",
        zipCode: "13494",
        address: "경기도 성남시 분당구 정자동 178",
        phone: "031-222-3333",
        mobile: "010-3333-4444",
        quantity: 2,
        itemName: "토너 카트리지",
        message: "부재시 경비실",
        freightType: "착불",
      },
      {
        id: crypto.randomUUID(),
        createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        recipientName: "박철수",
        zipCode: "48058",
        address: "부산광역시 해운대구 우동 1500",
        phone: "051-444-5555",
        mobile: "010-5555-6666",
        quantity: 5,
        itemName: "포장 박스 중",
        message: "",
        freightType: "신용",
      },
      {
        id: crypto.randomUUID(),
        createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        recipientName: "이수민",
        zipCode: "34141",
        address: "대전광역시 유성구 대학로 99",
        phone: "042-666-7777",
        mobile: "010-7777-8888",
        quantity: 3,
        itemName: "볼펜 검정",
        message: "안전하게 부탁드립니다",
        freightType: "선불",
      },
    ];
    saveData("erp.shipping.orders", seedOrders);
  }

  window.localStorage.setItem(SEED_FLAG, "1");
}

import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { combineProductNameAndWeight, convertMeatboxRowToHanjinRow, needsReview } from "../lib/shipping/convert-meatbox-to-hanjin";
import { createHanjinWorkbook, HANJIN_HEADERS } from "../lib/shipping/export-hanjin-excel";
import { convertCoupangWingRowToHanjinRow } from "../lib/shipping/convert-coupang-wing-to-hanjin";
import { detectMarketplace } from "../lib/shipping/marketplace-detector";
import { parseCoupangWingWorkbook } from "../lib/shipping/parse-coupang-wing-excel";
import { parseMarketplaceExcel } from "../lib/shipping/parse-marketplace-excel";
import { parseMeatboxWorkbook } from "../lib/shipping/parse-meatbox-excel";

assert.equal(combineProductNameAndWeight("돈삼겹살", "10.35kg"), "돈삼겹살 / 10.35kg");
assert.equal(combineProductNameAndWeight("돈삼겹살", ""), "돈삼겹살");
assert.equal(combineProductNameAndWeight("", "10.35"), "10.35");
assert.equal(combineProductNameAndWeight(null, undefined), "");

const input = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(input, XLSX.utils.aoa_to_sheet([["안내"]]), "안내");
XLSX.utils.book_append_sheet(input, XLSX.utils.aoa_to_sheet([
  ["미트박스 주문현황"],
  ["상품명", "계근중량", "받는사람", "받는사람연락처", "우편번호", "배송지 주소", "배송시주의사항"],
  ["[호주] 염소갈비", "10.25kg", "홍길동", "01012345678", "01234", "서울시", "문 앞"],
  ["상품만", "", "", "", "", "주소", ""],
  ["상품3", "9.5", "김철수", "01099998888", "12345", "부산시", ""],
  ["", "", "", "", "", "", ""],
]), "주문");
const parsed = parseMeatboxWorkbook(input);
assert.equal(parsed.length, 3);
assert.equal(parsed[0]?.row.postalCode, "01234");
assert.equal(parsed[0]?.sourceRowNumber, 3);
const converted = parsed.map(({ row }) => convertMeatboxRowToHanjinRow(row));
assert.equal(converted[0]?.productName, "[호주] 염소갈비 / 10.25kg");
assert.equal(converted[0]?.phone, "");
assert.equal(converted[0]?.mobilePhone, "01012345678");
assert.equal(converted[0]?.packageQuantity, 1);
assert.equal(converted[0]?.deliveryMessage, "문 앞");
assert.equal(needsReview(converted[0]!), false);
assert.equal(needsReview(converted[1]!), true);

const output = createHanjinWorkbook(converted);
const sheet = output.Sheets["한진택배"]!;
const data = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, { header: 1, raw: true, defval: "" });
assert.deepEqual(data[0], HANJIN_HEADERS);
assert.equal(data[1]?.length, 12);
assert.equal(data[1]?.[3], "");
assert.equal(data[1]?.[5], 1);
assert.equal(data[1]?.[6], "");
assert.equal(data[1]?.[7], "");
assert.equal(data[1]?.[8], "[호주] 염소갈비 / 10.25kg");
assert.equal(data[1]?.[9], "");
assert.equal(data[1]?.[10], "문 앞");

const roundTrip = XLSX.read(XLSX.write(output, { type: "buffer", bookType: "xlsx" }), { type: "buffer" });
const roundTripData = XLSX.utils.sheet_to_json<Array<string | number>>(roundTrip.Sheets["한진택배"]!, { header: 1, raw: true, defval: "" });
assert.equal(roundTripData[1]?.[1], "01234");
assert.equal(roundTripData[1]?.[4], "01012345678");
assert.equal(roundTripData[1]?.[5], 1);

const coupangInput = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(coupangInput, XLSX.utils.aoa_to_sheet([]), "빈 시트");
XLSX.utils.book_append_sheet(coupangInput, XLSX.utils.aoa_to_sheet([
  ["쿠팡윙 주문 목록"],
  [" 노출상품명\n(옵션명) ", "수취인이름", "수취인\n전화번호", "우편번호", "수취인 주소", "배송 메시지"],
  ["육미가 염소탕 600g 5팩", "홍길동", "010-1234-5678", "01234", "서울시 강남구", "문 앞에 놓아주세요"],
  ["=위험상품", "", "01012345678", "", "주소", ""],
  ["", "", "", "", "", ""],
]), "주문");
assert.equal(detectMarketplace(coupangInput), "coupang-wing");
const coupangParsed = parseCoupangWingWorkbook(coupangInput);
assert.equal(coupangParsed.length, 2);
assert.equal(coupangParsed[0]?.row.postalCode, "01234");
assert.equal(coupangParsed[0]?.sourceRowNumber, 3);
const coupangConverted = coupangParsed.map(({ row }) => convertCoupangWingRowToHanjinRow(row));
assert.equal(coupangConverted[0]?.receiverName, "홍길동");
assert.equal(coupangConverted[0]?.mobilePhone, "010-1234-5678");
assert.equal(coupangConverted[0]?.address, "서울시 강남구");
assert.equal(coupangConverted[0]?.productName, "육미가 염소탕 600g 5팩");
assert.equal(coupangConverted[0]?.deliveryMessage, "문 앞에 놓아주세요");
assert.equal(coupangConverted[0]?.phone, "");
assert.equal(coupangConverted[0]?.packageQuantity, 1);

const coupangArray = XLSX.write(coupangInput, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
assert.throws(() => parseMarketplaceExcel(coupangArray, "meatbox", "coupang.xlsx"), /쿠팡윙 업로드 영역/);
const sourcedCoupang = parseMarketplaceExcel(coupangArray, "coupang-wing", "coupang.xlsx");
assert.equal(sourcedCoupang.length, 2);
assert.equal(sourcedCoupang[0]?.source, "coupang-wing");
assert.equal(sourcedCoupang[0]?.sourceFileName, "coupang.xlsx");
assert.equal(sourcedCoupang[0]?.sourceRowNumber, 3);
const coupangOutput = createHanjinWorkbook(coupangConverted);
const coupangData = XLSX.utils.sheet_to_json<Array<string | number>>(coupangOutput.Sheets["한진택배"]!, { header: 1, raw: true, defval: "" });
assert.equal(coupangData[1]?.[0], "홍길동");
assert.equal(coupangData[1]?.[1], "01234");
assert.equal(coupangData[1]?.[3], "");
assert.equal(coupangData[1]?.[4], "010-1234-5678");
assert.equal(coupangData[1]?.[5], 1);
assert.equal(coupangData[1]?.[6], "");
assert.equal(coupangData[1]?.[7], "");
assert.equal(coupangData[1]?.[8], "육미가 염소탕 600g 5팩");
assert.equal(coupangData[1]?.[9], "");
assert.equal(coupangData[1]?.[10], "문 앞에 놓아주세요");
assert.equal(coupangData[1]?.[11], "");
assert.equal(coupangData[2]?.[8], "'=위험상품");

for (const productHeader of ["노출상품명(옵션명)", "노출상품명 (옵션명)", "노출상품명", " 노출상품명(옵션명) ", "노출상품명\n(옵션명)"]) {
  const aliasWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(aliasWorkbook, XLSX.utils.aoa_to_sheet([[productHeader, "수취인 이름", "수취인전화번호", "수취인주소"], ["상품", "이름", "01012345678", "주소"]]), "주문");
  assert.equal(parseCoupangWingWorkbook(aliasWorkbook).length, 1);
  assert.equal(detectMarketplace(aliasWorkbook), "coupang-wing");
}

const meatboxArray = XLSX.write(input, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
const sourcedMeatbox = parseMarketplaceExcel(meatboxArray, "meatbox", "meatbox.xlsx");
const combined = [...sourcedMeatbox, ...sourcedCoupang];
assert.equal(combined.length, 5);
assert.deepEqual(combined.map((row) => row.source), ["meatbox", "meatbox", "meatbox", "coupang-wing", "coupang-wing"]);
const combinedData = XLSX.utils.sheet_to_json<Array<string | number>>(createHanjinWorkbook(combined).Sheets["한진택배"]!, { header: 1, raw: true, defval: "" });
assert.equal(combinedData.length - 1, 5);
assert.equal(combinedData[0]?.includes("판매처"), false);
assert.equal(combinedData[0]?.includes("원본 행"), false);

console.log("shipping self-test: all assertions passed");

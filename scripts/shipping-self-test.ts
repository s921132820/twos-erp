import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import XlsxPopulate from "xlsx-populate";
import { combineProductNameAndWeight, convertMeatboxRowToHanjinRow, formatMeatboxWeight, getMeatboxProductLabel, needsReview, normalizeProductNumber } from "../lib/shipping/convert-meatbox-to-hanjin";
import { createHanjinWorkbook, HANJIN_HEADERS } from "../lib/shipping/export-hanjin-excel";
import { convertCoupangWingRowToHanjinRow } from "../lib/shipping/convert-coupang-wing-to-hanjin";
import { detectMarketplace } from "../lib/shipping/marketplace-detector";
import { parseCoupangWingWorkbook } from "../lib/shipping/parse-coupang-wing-excel";
import { parseMarketplaceExcel } from "../lib/shipping/parse-marketplace-excel";
import { parseMeatboxWorkbook } from "../lib/shipping/parse-meatbox-excel";
import { parseEncryptedSmartStoreExcel } from "../lib/shipping/parse-encrypted-smart-store-excel";
import { parseMeatfriendsWorkbook } from "../lib/shipping/parse-meatfriends-excel";
import { convertMeatfriendsRowToHanjinRow, joinAddressParts } from "../lib/shipping/convert-meatfriends-to-hanjin";
import { isHtmlTableFile, normalizeHtmlCellText, parseHtmlTableRows, parseMeatfriendsFile } from "../lib/shipping/parse-meatfriends-file";
import { DEFAULT_DELIVERY_MESSAGE } from "../lib/shipping/constants";
import { normalizeDeliveryMessage } from "../lib/shipping/excel-utils";
import { createInitialManualForm, createManualShippingRow, normalizePackageQuantity } from "../lib/shipping/manual-shipping";
import { groupShippingRowsByProduct, normalizeProductNameForGrouping } from "../lib/shipping/product-summary";
import { commitProductSummaryName, createEditableProductSummaries, normalizeSummaryQuantity } from "../lib/shipping/editable-product-summary";
import { createProductSummaryWorkbook, getProductSummaryFileName, prepareProductSummaryExportRows } from "../lib/shipping/export-product-summary";

assert.equal(combineProductNameAndWeight("돈삼겹살", "10.35kg"), "돈삼겹살 10.35kg");
assert.equal(combineProductNameAndWeight("돈삼겹살", ""), "돈삼겹살");
assert.equal(combineProductNameAndWeight("", "10.35"), "10.35kg");
assert.equal(combineProductNameAndWeight(null, undefined), "");
assert.equal(normalizeProductNumber(" 285058 "), "285058");
assert.equal(getMeatboxProductLabel(285058), "(박피)");
assert.equal(getMeatboxProductLabel(" 285055 "), "(암)");
assert.equal(getMeatboxProductLabel("217548"), "(수)");
assert.equal(getMeatboxProductLabel("999999"), "");
assert.equal(getMeatboxProductLabel(undefined), "");
assert.equal(combineProductNameAndWeight("염소 앞다리", "12.30kg", 285058), "염소 앞다리 (박피) 12.30kg");
assert.equal(combineProductNameAndWeight("염소 앞다리", "12.30kg", "285055"), "염소 앞다리 (암) 12.30kg");
assert.equal(combineProductNameAndWeight("염소 앞다리", "12.30kg", " 217548 "), "염소 앞다리 (수) 12.30kg");
assert.equal(combineProductNameAndWeight("염소 앞다리", "12.30kg", 999999), "염소 앞다리 12.30kg");
assert.equal(formatMeatboxWeight(12.3), "12.3kg");
assert.equal(formatMeatboxWeight("12.30"), "12.30kg");
for (const weight of ["12.30kg", "12.30 kg", "12.30KG", "12.30 Kg"]) assert.equal(formatMeatboxWeight(weight), "12.30kg");
for (const emptyWeight of ["", " ", null, undefined]) assert.equal(formatMeatboxWeight(emptyWeight), "");
assert.equal(formatMeatboxWeight("약 12.3"), "약 12.3kg");
for (const emptyMessage of [undefined, null, "", " ", "\n", "\r\n"]) assert.equal(normalizeDeliveryMessage(emptyMessage), DEFAULT_DELIVERY_MESSAGE);
assert.equal(normalizeDeliveryMessage(" 문 앞에 놓아주세요 "), "문 앞에 놓아주세요");

const emptyManual = createInitialManualForm();
assert.equal(emptyManual.packageQuantity, 1);
assert.equal(emptyManual.deliveryMessage, DEFAULT_DELIVERY_MESSAGE);
assert.equal(createManualShippingRow(emptyManual), null);
const manual = createManualShippingRow({ ...emptyManual, receiverName: "manual receiver", mobilePhone: "010-9999-8888", productName: "manual product", packageQuantity: 0 }, "manual-test");
assert.ok(manual);
assert.equal(manual.rowKey, "manual:manual-test");
assert.equal(manual.phone, manual.mobilePhone);
assert.equal(manual.packageQuantity, 1);
assert.equal(manual.source, "manual");
assert.equal(normalizePackageQuantity(2), 2);
assert.equal(normalizePackageQuantity(-1), 1);
assert.equal(normalizeProductNameForGrouping("  LA갈비\n  선물세트  "), "LA갈비 선물세트");
const productGroups = groupShippingRowsByProduct([
  { ...manual, rowKey: "summary-1", productName: " LA갈비 ", packageQuantity: 1, source: "manual" },
  { ...manual, rowKey: "summary-2", productName: "la갈비", packageQuantity: 2, source: "meatbox" },
  { ...manual, rowKey: "summary-3", productName: "LA갈비\n", packageQuantity: 1, source: "coupang-wing" },
  { ...manual, rowKey: "summary-4", productName: "", packageQuantity: 1, source: "smart-store" },
]);
assert.equal(productGroups.length, 2);
assert.equal(productGroups[0]?.productName, "LA갈비");
assert.equal(productGroups[0]?.quantity, 4);
assert.equal(productGroups[1]?.productName, "물품명 미입력");
assert.equal(productGroups[1]?.quantity, 1);
const editableGroups = createEditableProductSummaries([{ key: "la갈비", productName: "LA갈비", quantity: 3 }, { key: "안심", productName: "안심", quantity: 2 }]);
assert.equal(editableGroups[0]?.id, "product-summary:la갈비");
const renamedGroups = commitProductSummaryName(editableGroups.map((row) => row.id === "product-summary:la갈비" ? { ...row, productName: "  LA갈비   프리미엄 " } : row), "product-summary:la갈비");
assert.equal(renamedGroups[0]?.productName, "LA갈비 프리미엄");
const mergedGroups = commitProductSummaryName(editableGroups.map((row) => row.id === "product-summary:안심" ? { ...row, productName: " la갈비 " } : row), "product-summary:안심");
assert.equal(mergedGroups.length, 1);
assert.equal(mergedGroups[0]?.productName, "LA갈비");
assert.equal(mergedGroups[0]?.quantity, 5);
assert.equal(normalizeSummaryQuantity("7", 3), 7);
for (const invalid of ["", "-1", "1.5", "abc", "NaN"]) assert.equal(normalizeSummaryQuantity(invalid, 3), 3);
const preparedSummaryExport = prepareProductSummaryExportRows([{ productName: " LA갈비 ", quantity: 2 }, { productName: "la갈비", quantity: 3 }, { productName: "안심", quantity: 0 }, { productName: " ", quantity: 9 }, { productName: "invalid", quantity: -1 }]);
assert.deepEqual(preparedSummaryExport, [{ productName: "LA갈비", quantity: 5 }, { productName: "안심", quantity: 0 }]);
const summaryWorkbook = createProductSummaryWorkbook(preparedSummaryExport);
assert.deepEqual(summaryWorkbook.SheetNames, ["물품별 집계"]);
const summaryData = XLSX.utils.sheet_to_json<Array<string | number>>(summaryWorkbook.Sheets["물품별 집계"]!, { header: 1, raw: true, defval: "" });
assert.deepEqual(summaryData, [["번호", "물품명", "개수"], [1, "LA갈비", 5], [2, "안심", 0]]);
assert.equal(typeof summaryData[1]?.[0], "number");
assert.equal(typeof summaryData[1]?.[2], "number");
assert.equal(getProductSummaryFileName(new Date(2026, 6, 29)), "물품별 집계_20260729.xlsx");

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
assert.equal(converted[0]?.productName, "[호주] 염소갈비 10.25kg");
assert.equal(converted[0]?.phone, "01012345678");
assert.equal(converted[0]?.phone, converted[0]?.mobilePhone);
assert.equal(converted[0]?.mobilePhone, "01012345678");
assert.equal(converted[0]?.packageQuantity, 1);
assert.equal(converted[0]?.deliveryMessage, "문 앞");
assert.equal(needsReview(converted[0]!), false);
assert.equal(needsReview(converted[1]!), true);
assert.equal(converted[1]?.phone, "");
assert.equal(converted[1]?.mobilePhone, "");
assert.equal(converted[1]?.deliveryMessage, DEFAULT_DELIVERY_MESSAGE);

const labeledMeatboxWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(labeledMeatboxWorkbook, XLSX.utils.aoa_to_sheet([
  ["상품번호", "상품명", "계근중량", "받는사람", "받는사람연락처", "배송지 주소"],
  [285058, "염소 앞다리", "12.30kg", "수취인", "01012345678", "서울시"],
  [" 285055 ", "염소 앞다리", "12.30kg", "수취인", "01012345678", "서울시"],
  [217548, "염소 앞다리", "12.30kg", "수취인", "01012345678", "서울시"],
  [999999, "염소 앞다리", "12.30kg", "수취인", "01012345678", "서울시"],
]), "orders");
const labeledRows = parseMeatboxWorkbook(labeledMeatboxWorkbook).map(({ row }) => convertMeatboxRowToHanjinRow(row));
assert.deepEqual(labeledRows.map((row) => row.productName), [
  "염소 앞다리 (박피) 12.30kg", "염소 앞다리 (암) 12.30kg", "염소 앞다리 (수) 12.30kg", "염소 앞다리 12.30kg",
]);

const output = createHanjinWorkbook(converted);
const sheet = output.Sheets["한진택배"]!;
const data = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, { header: 1, raw: true, defval: "" });
assert.deepEqual(data[0], HANJIN_HEADERS);
assert.equal(data[1]?.length, 12);
assert.equal(data[1]?.[3], "01012345678");
assert.equal(data[1]?.[3], data[1]?.[4]);
assert.equal(data[1]?.[5], 1);
assert.equal(data[1]?.[6], "");
assert.equal(data[1]?.[7], "");
assert.equal(data[1]?.[8], "[호주] 염소갈비 10.25kg");
assert.equal(data[1]?.[9], "");
assert.equal(data[1]?.[10], "문 앞");

const roundTrip = XLSX.read(XLSX.write(output, { type: "buffer", bookType: "xlsx" }), { type: "buffer" });
const roundTripData = XLSX.utils.sheet_to_json<Array<string | number>>(roundTrip.Sheets["한진택배"]!, { header: 1, raw: true, defval: "" });
assert.equal(roundTripData[1]?.[1], "01234");
assert.equal(roundTripData[1]?.[4], "01012345678");
assert.equal(roundTripData[1]?.[5], 1);

assert.equal(joinAddressParts(" 경기도  광주시 ", " 101동\n202호 "), "경기도 광주시 101동 202호");
assert.equal(joinAddressParts("경기도 광주시", ""), "경기도 광주시");
assert.equal(joinAddressParts("", "101동 202호"), "101동 202호");
assert.equal(joinAddressParts(null, undefined), "");

const meatfriendsInput = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(meatfriendsInput, XLSX.utils.aoa_to_sheet([["안내"], [""]]), "guide");
XLSX.utils.book_append_sheet(meatfriendsInput, XLSX.utils.aoa_to_sheet([
  ["미트프렌즈 주문"],
  [" 상품명\n", "상세주소", " 주소 ", "우편번호", "기본연락처", "수취인명", "추가열"],
  ["갈비살 600g", "101동 202호", "경기도  광주시", "01234", "010-1234-5678", "홍길동", "무시"],
  ["안심", "", "서울시", "04567", "01098765432", "김영희", ""],
  ["", "", "", "", "", "", ""],
]), "orders");
assert.equal(detectMarketplace(meatfriendsInput), "meatfriends");
const meatfriendsParsed = parseMeatfriendsWorkbook(meatfriendsInput);
assert.equal(meatfriendsParsed.length, 2);
assert.equal(meatfriendsParsed[0]?.sourceRowNumber, 3);
const meatfriendsConverted = meatfriendsParsed.map(({ row }) => convertMeatfriendsRowToHanjinRow(row));
assert.deepEqual(meatfriendsConverted[0], { receiverName: "홍길동", postalCode: "01234", address: "경기도 광주시 101동 202호", phone: "010-1234-5678", mobilePhone: "010-1234-5678", packageQuantity: 1, emptyColumn1: "", emptyColumn2: "", productName: "갈비살 600g", emptyColumn3: "", deliveryMessage: DEFAULT_DELIVERY_MESSAGE, shippingFareType: "" });
assert.equal(meatfriendsConverted[1]?.address, "서울시");
const meatfriendsArray = XLSX.write(meatfriendsInput, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
const sourcedMeatfriends = parseMarketplaceExcel(meatfriendsArray, "meatfriends", "meatfriends.xlsx");
assert.equal(sourcedMeatfriends[0]?.source, "meatfriends");
assert.equal(sourcedMeatfriends[0]?.rowKey, "meatfriends:meatfriends.xlsx:3");
const missingMeatfriends = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(missingMeatfriends, XLSX.utils.aoa_to_sheet([["수취인명", "기본연락처", "우편번호", "주소"]]), "orders");
assert.throws(() => parseMeatfriendsWorkbook(missingMeatfriends), /필수 컬럼이 없습니다: 상품명/);

const htmlHeaders = [...Array.from({ length: 75 }, (_, index) => `추가열${index}`), "상품명", "수취인명", "기본연락처", "우편번호", "주소", "상세주소"];
const htmlValues = [...Array.from({ length: 75 }, () => ""), "갈비살 &amp; 안심&nbsp; 4kg", "홍길동", "010-1234-5678", "01234", "경기도&nbsp; 광주시", "101동<br>202호"];
const meatfriendsHtml = `\uFEFF<table border="1"><tr>${htmlHeaders.map((header) => `<td>${header}</td>`).join("")}</tr><tr>${htmlValues.map((value) => `<td>${value}</td>`).join("")}</tr><tr>${htmlHeaders.map(() => "<td>&nbsp;</td>").join("")}</tr></table>`;
const htmlBytes = new TextEncoder().encode(meatfriendsHtml);
const htmlBuffer = htmlBytes.buffer.slice(htmlBytes.byteOffset, htmlBytes.byteOffset + htmlBytes.byteLength) as ArrayBuffer;
assert.equal(isHtmlTableFile(htmlBuffer), true);
assert.equal(isHtmlTableFile(meatfriendsArray), false);
assert.equal(normalizeHtmlCellText(" \u00a0 \n "), "");
const htmlRows = parseHtmlTableRows(meatfriendsHtml);
assert.equal(htmlRows[0]?.length, 81);
assert.equal(htmlRows[1]?.[75], "갈비살 & 안심 4kg");
const htmlConverted = parseMeatfriendsFile(htmlBuffer, "배송조회_20260728.xls");
assert.equal(htmlConverted.length, 1);
assert.equal(htmlConverted[0]?.rowKey, "meatfriends:배송조회_20260728.xls:2");
assert.equal(htmlConverted[0]?.receiverName, "홍길동");
assert.equal(htmlConverted[0]?.postalCode, "01234");
assert.equal(htmlConverted[0]?.address, "경기도 광주시 101동 202호");
assert.equal(htmlConverted[0]?.phone, "010-1234-5678");
assert.equal(htmlConverted[0]?.mobilePhone, "010-1234-5678");
assert.equal(htmlConverted[0]?.productName, "갈비살 & 안심 4kg");
assert.equal(htmlConverted[0]?.packageQuantity, 1);
assert.equal(htmlConverted[0]?.deliveryMessage, DEFAULT_DELIVERY_MESSAGE);

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
assert.equal(coupangConverted[0]?.phone, "010-1234-5678");
assert.equal(coupangConverted[0]?.phone, coupangConverted[0]?.mobilePhone);
assert.equal(coupangConverted[1]?.deliveryMessage, DEFAULT_DELIVERY_MESSAGE);
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
assert.equal(coupangData[1]?.[3], "010-1234-5678");
assert.equal(coupangData[1]?.[3], coupangData[1]?.[4]);
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

async function testSmartStoreEncryption() {
const smartStoreWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(smartStoreWorkbook, XLSX.utils.aoa_to_sheet([["수취인명", "상품명", "통합배송지", "구매자연락처"]]), "안내");
XLSX.utils.book_append_sheet(smartStoreWorkbook, XLSX.utils.aoa_to_sheet([
  ["스마트스토어 발주 목록"],
  [" 수취인 명 ", "상품명", "통합\n배송지", "구매자 연락처", "우편번호", "배송 메시지"],
  ["박하나", "스마트 상품1", "대전시", "010-1111-2222", "01234", "문 앞"],
  ["박둘", "스마트 상품2", "대구시", "01033334444", "23456", ""],
  ["박셋", "스마트 상품3", "광주시", "01055556666", "34567", "경비실"],
  ["", "스마트 상품4", "", "01077778888", "", ""],
  ["", "", "", "", "", ""],
]), "주문");
const smartPlain = XLSX.write(smartStoreWorkbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
const populateWorkbook = await XlsxPopulate.fromDataAsync(smartPlain);
const smartEncrypted = await populateWorkbook.outputAsync({ type: "arraybuffer", password: "1234" });
assert.ok(smartEncrypted instanceof ArrayBuffer);
const sourcedSmartStore = await parseEncryptedSmartStoreExcel(smartEncrypted, "smart-store.xlsx");
assert.equal(sourcedSmartStore.length, 4);
assert.equal(sourcedSmartStore[0]?.source, "smart-store");
assert.equal(sourcedSmartStore[0]?.sourceRowNumber, 3);
assert.equal(sourcedSmartStore[0]?.receiverName, "박하나");
assert.equal(sourcedSmartStore[0]?.productName, "스마트 상품1");
assert.equal(sourcedSmartStore[0]?.address, "대전시");
assert.equal(sourcedSmartStore[0]?.mobilePhone, "010-1111-2222");
assert.equal(sourcedSmartStore[0]?.postalCode, "01234");
assert.equal(sourcedSmartStore[0]?.deliveryMessage, "문 앞");
assert.equal(sourcedSmartStore[0]?.phone, sourcedSmartStore[0]?.mobilePhone);
assert.equal(sourcedSmartStore[1]?.deliveryMessage, DEFAULT_DELIVERY_MESSAGE);
assert.equal(sourcedSmartStore[3]?.validation.isValid, false);

const wrongPasswordWorkbook = await XlsxPopulate.fromDataAsync(smartPlain);
const wrongPasswordEncrypted = await wrongPasswordWorkbook.outputAsync({ type: "arraybuffer", password: "9999" });
assert.ok(wrongPasswordEncrypted instanceof ArrayBuffer);
await assert.rejects(() => parseEncryptedSmartStoreExcel(wrongPasswordEncrypted, "wrong.xlsx"), /비밀번호를 해제하지 못했습니다/);

const allMarketplaces = [...sourcedMeatbox, ...sourcedCoupang, ...sourcedSmartStore, ...sourcedMeatfriends];
assert.equal(allMarketplaces.length, 11);
assert.deepEqual(allMarketplaces.map((row) => row.source), ["meatbox", "meatbox", "meatbox", "coupang-wing", "coupang-wing", "smart-store", "smart-store", "smart-store", "smart-store", "meatfriends", "meatfriends"]);
const allData = XLSX.utils.sheet_to_json<Array<string | number>>(createHanjinWorkbook(allMarketplaces).Sheets["한진택배"]!, { header: 1, raw: true, defval: "" });
assert.equal(allData.length - 1, 11);
assert.equal(allData[6]?.[0], "박하나");
assert.equal(allData[6]?.[3], "010-1111-2222");
assert.equal(allData[6]?.[3], allData[6]?.[4]);
assert.equal(allData[6]?.[5], 1);
assert.equal(allData[6]?.[8], "스마트 상품1");
assert.equal(allData[7]?.[10], DEFAULT_DELIVERY_MESSAGE);
for (const row of allData.slice(1)) assert.equal(row[3], row[4]);
}

void testSmartStoreEncryption().then(() => console.log("shipping self-test: all assertions passed")).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "shipping self-test failed");
  process.exitCode = 1;
});

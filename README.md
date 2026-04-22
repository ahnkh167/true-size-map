# 세계지도 크기 비교 · True Size Map

머케이터 도법의 면적 왜곡을 직접 비교해볼 수 있는 인터랙티브 세계지도 웹앱.

## 기능

- 🌍 **나라/주 검색** (한국어·영어)
- 🖱️ **드래그로 위치 이동** — 위도가 바뀌면 머케이터 투영의 실제 크기 변화가 보임
- ⌨️ **방향키 / 회전키(Q·E)** — 선택한 나라/주를 정밀 조작
- 🇰🇷 **주/도 토글** — 미국·캐나다·멕시코·브라질·일본·중국·한국·호주·영국 4개국 등 서브디비전 표시·클릭 가능
- 📊 **상세 정보** — 국기, 인구, 면적, 수도, 세계 면적 순위, 주/도 내 면적 순위
- 🔗 **위키피디아 링크** — 클릭 한 번으로 더 많은 정보로 이동
- 📱 **모바일 대응** — 터치 드래그, 반응형 패널, 접기/펴기

## 사용 데이터

- 나라 경계: [johan/world.geo.json](https://github.com/johan/world.geo.json)
- 미국 주: [PublicaMundi/MappingAPI](https://github.com/PublicaMundi/MappingAPI)
- 캐나다·멕시코·브라질·일본: [codeforamerica/click_that_hood](https://github.com/codeforamerica/click_that_hood)
- 한국: [southkorea/southkorea-maps](https://github.com/southkorea/southkorea-maps)
- 호주: [rowanhogan/australian-states](https://github.com/rowanhogan/australian-states)
- 중국: [longwosion/geojson-map-china](https://github.com/longwosion/geojson-map-china)
- 영국: [Natural Earth](https://github.com/nvkelso/natural-earth-vector) (map_subunits)
- 나라 정보: [REST Countries API](https://restcountries.com/)
- 지도 타일: [CARTO Positron](https://carto.com/) + [© OpenStreetMap](https://www.openstreetmap.org/)
- 지도 라이브러리: [Leaflet](https://leafletjs.com/)

## 사용법

`index.html`을 브라우저에서 바로 열면 됩니다. 빌드 단계 없음.

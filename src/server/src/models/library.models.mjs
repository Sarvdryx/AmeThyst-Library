// Mock Database for Books and Inventory
export const BOOKS = [
  {
    id: "1",
    title: "Harry Potter and the Deathly Hallows",
    author: "J.K. Rowlings",
    description: "A comprehensive exploration into the tectonic shifts of 21st-century spatial design. Prof. Sterling meticulously deconstructs the intersection of sustainable materials, algorithmic form-finding, and the sociological impact of high-density urban living. This seminal text serves as both a historical record of modernist evolution and a forward-looking manifesto for digital fabrication in public infrastructure. It is essential reading for postgraduate candidates and licensed practitioners alike.",
    category: "Fantasy",
    isbn: "978-3-16-148410-0",
    language: "English",
    coverImage: "/Rectangle1270.png"
  },
  {
    id: "101",
    title: "Urbanism in the Digital Age",
    author: "Dr. Julian Vance",
    category: "URBAN PLANNING",
    coverImage: "/Ab6axudgephgjlfypundjddc4n9ybuj0nkjc_hap3gxxfk34c8epdztjzergki9iwvgpziosz5ja2h6er4hb99fqojdgxm8zoof_easnyzvsdilbrrfcak5xrstlosh5zlv1peqhuxikmbqhcq5ehttwxas0kszlbduvgohbaenantwpz1grwh500qybeyb8rpbrlh8tazcddlofzrwmwaiwacxlz_n2hplywhn__1p64foljgbvvqx8d83tltqgxroyzrxt88mhkr3xci.png"
  },
  {
    id: "102",
    title: "Sustainable Structuralism",
    author: "Sarah G. Aris",
    category: "SUSTAINABILITY",
    coverImage: "/Ab6axuadx02ucdxemd3basyrbhl7gyievycb5ykf_xxfdira_kocobnbvlhsukwbsytzccrbhnyeowqjlodajegccrg5jyjsm5kreaqhbfpzw196fehz4cn4dne5lpxiddthrtp2kpxxkcth4nqmc5tfipu51wwji8ziw9ipgjqt1xbylj9w7sai9ixdiripzea7ptmjv4olxp77vj3qzcf4n3yq0cydlcgoeaqzeekrlhlhcwddm7kx1_zc4yqoyps9lmzh5t56u7su.png"
  },
  {
    id: "103",
    title: "The Bauhaus Legacy",
    author: "Marcus Thorne",
    category: "Fantasy",
    coverImage: "/Ab6axuados7zrilzrewclwddkpronqpf40paswjnibqeyfig5yyymm3wavcwiedtde77ooremekhvi4rmq8txpoy_ztjrlzxrpwywwhsj1gelq0gviokllqfksy0mvtqb6p55lyhbvx7ontarprgznppswr86sz3z07fgzb1punafync77neym30h5vretpxtdxh1abqavj8x4tia4ewebxd2bdhhun0gnpgm00vcz5d4rxmahqnieayurc7qku3cegkw4mcyldpoaeu.png"
  },
  {
    id: "104",
    title: "Geometry and Grace in Design",
    author: "Linus Feng",
    category: "Fantasy",
    coverImage: "/Ab6axuci2gkd3dqh5cmgkspkhhffcri1mk8t0gawo4td5p8vs6kttglhr7p17gjrslhwzlnujn3bvlua0eekmcmtlurel2h7l6fr2wifoc0ltkkqh0hgpqz6phwdh6pwjzotzvh47jy2jc0voht3lix69e7ywtsrohqrdvaca6witu1mzpxhzy78bfhhgqev14ikg1lhpske16y5btjt74oplhrfttjec0fadfdwlvuhw45elmcdgxh9wjl8katf0qgpi2ms0znyo.png"
  },
  {
    id: "105",
    title: "Parametric Paradigms",
    author: "Ava Chen",
    category: "Fantasy",
    coverImage: "/Ab6axudbjt8_fsruufjo9vaiilar9r7khkhqyxyv29n6peup_kssmknkwoc0ulngj_xp_sxwwqma88zavgvf5uig0xnkvxubmxeohxak74l18xruohsorlyywjs8nictzavtllffongfqf29dpznjzur22oezyp2boiyds6o3uh9vhsirkgpkgqdnk_6_ukkjkdmtt_4ionwdmpx9ddgrkgh_xrbrhxevjhqm9zab2e3rdmwiozcipwf6zz6s82_wmzr4qukgykatyc.png"
  }
];

export const INVENTORY = [
  { bookId: "1", floor: 3, wing: "East Wing", shelfId: "AR-204", availableCopies: 2 },
  { bookId: "101", floor: 1, wing: "West Wing", shelfId: "UP-101", availableCopies: 5 },
  { bookId: "102", floor: 2, wing: "North Wing", shelfId: "SS-202", availableCopies: 3 },
  { bookId: "103", floor: 4, wing: "South Wing", shelfId: "BL-404", availableCopies: 1 },
  { bookId: "104", floor: 3, wing: "East Wing", shelfId: "GD-303", availableCopies: 4 },
  { bookId: "105", floor: 5, wing: "Central Hub", shelfId: "PP-505", availableCopies: 2 }
];

export const RESERVATIONS = [];

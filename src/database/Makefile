export-databook:
	docker exec -t library_postgres pg_dump -U lib_admin -d postgres -t books > 01_databook.sql

export-datalibrary:
	docker exec -t library_postgres pg_dump -U lib_admin -d postgres -t branches -t library > 02_datalibrary.sql

export-datafacility:
	docker exec -t library_postgres pg_dump -U lib_admin -d library_db -t study_room -t room_avail > 03_datafacility.sql

export-datauser:
	docker exec -t library_postgres pg_dump -U lib_admin -d library_db -t users > 04_datauser.sql

export-initrest:
	docker exec -t library_postgres pg_dump -U lib_admin -d library_db -T books -T branches -T branches_branch_id_seq -T library -T study_room -T room_avail -T users > 05_init_rest.sql


export-datacsv:
	docker exec -i -e PGCLIENTENCODING=UTF8 library_postgres psql -U lib_admin -d postgres -c "\copy (SELECT book_id, title, author, description, genres, publication_date, num_pages, rating, language_code, embedding FROM public.books) TO '/tmp/books.csv' WITH CSV HEADER;"	
	docker exec -i -e PGCLIENTENCODING=UTF8 library_postgres psql -U lib_admin -d postgres -c "\copy (SELECT branch_id, name_short, address FROM public.branches) TO '/tmp/branches.csv' WITH CSV HEADER;"
	docker exec -i -e PGCLIENTENCODING=UTF8 library_postgres psql -U lib_admin -d postgres -c "\copy (SELECT book_id, branch_id, quantity, available_quantity FROM public.library) TO '/tmp/library.csv' WITH CSV HEADER;"
	docker exec -i -e PGCLIENTENCODING=UTF8 library_postgres psql -U lib_admin -d postgres -c "\copy (SELECT user_id, username, role FROM public.users) TO '/tmp/users.csv' WITH CSV HEADER;"
	docker exec -i -e PGCLIENTENCODING=UTF8 library_postgres psql -U lib_admin -d postgres -c "\copy (SELECT search_id, user_id, book_clicked, created_at, search_content FROM public.search_history) TO '/tmp/searches.csv' WITH CSV HEADER;"
	docker exec -i -e PGCLIENTENCODING=UTF8 library_postgres psql -U lib_admin -d postgres -c "\copy (SELECT borrow_id, user_id, book_id, branch_id, reserve_date, borrow_date, due_date FROM public.borrow_book) TO '/tmp/borrow.csv' WITH CSV HEADER;"

export-cpcsv:
	docker cp library_postgres:/tmp/books.csv ./tmp_csv/books.csv
	docker cp library_postgres:/tmp/branches.csv ./tmp_csv/branches.csv
	docker cp library_postgres:/tmp/library.csv ./tmp_csv/library.csv
	docker cp library_postgres:/tmp/users.csv ./tmp_csv/users.csv
	docker cp library_postgres:/tmp/searches.csv ./tmp_csv/searches.csv
	docker cp library_postgres:/tmp/borrow.csv ./tmp_csv/borrow.csv

clean-csv:
	-rm -rf ./tmp_csv/*.csv
	-docker exec library_postgres rm -f /tmp/books.csv /tmp/branches.csv /tmp/library.csv /tmp/users.csv /tmp/searches.csv /tmp/borrow.csv

init-graph:
	python Init_data/Init_graph.py

export-graph:
	docker exec -i amethyst_memgraph mgconsole -c "DUMP DATABASE;" > ./amethyst_graph_dump.cypherl

import-data:
	docker exec -i library_postgres psql -U lib_admin -d postgres < ./init_db/postgres/01_databook.sql
	docker exec -i library_postgres psql -U lib_admin -d postgres < ./init_db/postgres/02_datalibrary.sql
	docker exec -i library_postgres psql -U lib_admin -d postgres < ./init_db/postgres/03_datafacility.sql
	docker exec -i library_postgres psql -U lib_admin -d postgres < ./init_db/postgres/04_datauser.sql
	docker exec -i library_postgres psql -U lib_admin -d postgres < ./init_db/postgres/05_init_rest.sql
	docker exec -i library_postgres psql -U lib_admin -d postgres < ./init_db/postgres/06_indexes.sql
	docker exec -i library_postgres psql -U lib_admin -d postgres < ./init_db/postgres/07_mock_data.sql
	docker exec -i library_postgres psql -v ON_ERROR_STOP=1 -U lib_admin -d postgres < ./init_db/postgres/08_security_hardening.sql

apply-security-hardening:
	docker exec -i library_postgres psql -v ON_ERROR_STOP=1 -U lib_admin -d postgres < ./init_db/postgres/08_security_hardening.sql

import-memgraph:
	docker exec -i amethyst_memgraph mgconsole --username amethyst_admin --password AmethystMG2026 < ./init_db/memgraph/init_graph.cypherl

mock-export:
	docker exec -t library_postgres pg_dump -U lib_admin -d postgres -t users -t user_wishlist -t search_history -t borrow_book -t return_book -t recommends --clean --if-exists >> 09_mock_data.sql	

export-memgraph:
	docker exec -i amethyst_memgraph mgconsole --username amethyst_admin --password AmethystMG2026 --output-format=cypherl > 010_datagraph.cypher

export-snapshot:
	python Init_data/Model_snapshot.py export

import-snapshot:
	python Init_data/Model_snapshot.py import

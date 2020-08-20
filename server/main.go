package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/url"
	"net/http"
)

func main() {
	var (
		addr   = flag.String("addr", "0.0.0.0:8476", "Address to host the HTTP server on")
		dir    = flag.String("dir", "./build", "The directory for serving static files")
		bucket = flag.String("bucket", "gnosis-dev-dfusion", "The Amazon AWS S3 bucket to proxy API requests to")
	)
	flag.Parse()

	http.Handle("/api/s3proxy/", http.StripPrefix("/api/s3proxy", &s3Proxy{*bucket}))
	http.Handle("/", http.FileServer(http.Dir(*dir)))

	log.Println("starting server on", *addr)
	if err := http.ListenAndServe(*addr, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}

type s3Proxy struct {
	bucket string
}

func (p *s3Proxy) ServeHTTP(rw http.ResponseWriter, request *http.Request) {
	u := *request.URL
	u.Scheme = "https"
	u.Host = fmt.Sprintf("%s.s3.amazonaws.com", p.bucket)
	log.Println("proxying request to", u.String())

	resp, err := http.Get(u.String())
	if err != nil {
		http.Error(rw, "500 internal server error", http.StatusInternalServerError)
		return
	}

	for _, header := range []string{"Content-Type", "Last-Modified", "ETag"} {
		rw.Header().Set(header, resp.Header.Get(header))
	}
	rw.WriteHeader(resp.StatusCode)

	io.Copy(rw, resp.Body)
}

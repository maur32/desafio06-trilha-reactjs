import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Link from 'next/link';
import PreviewButton from '../components/PreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function getMorePosts() {
    await fetch(nextPage)
      .then(data => data.json())
      .then(response => {
        const postsResponse = response.results.map(post => {
          return {
            uid: post.uid,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
            first_publication_date: post.first_publication_date,
          };
        });
        setPosts([...posts, ...postsResponse]);
        setNextPage(response.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={styles.container}>
        <img src="/images/Logo.svg" alt="logo" className={styles.logo} />
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`post/${post.uid}`} key={post.uid}>
              <a>
                <h3>{post.data.title}</h3>
                <p>{post.data.subtitle}</p>
                <small>
                  <time>
                    <FiCalendar />
                    {format(new Date(post.first_publication_date), 'd MMM y', {
                      locale: ptBR,
                    })}
                  </time>
                  <p>
                    <FiUser />
                    {post.data.author}
                  </p>
                </small>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button
              onClick={getMorePosts}
              type="button"
              className={styles.button}
            >
              Carregar mais posts
            </button>
          )}
          {preview && <PreviewButton>Sair do modo Preview</PreviewButton>}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        author: post.data.author,
        title: post.data.title,
        subtitle: post.data.subtitle,
      },
    };
  });
  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview,
    },
  };
};

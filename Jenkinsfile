pipeline {
    agent any

    environment {
        DOCKER_HUB = "sujitht007"
        IMAGE_NAME = "microservice-app"
    }

    stages {

        stage('Build') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'echo "No tests yet"'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t $DOCKER_HUB/$IMAGE_NAME:latest ."
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([string(credentialsId: 'dockerhub-pass', variable: 'PASS')]) {
                    sh "docker login -u $DOCKER_HUB -p $PASS"
                    sh "docker push $DOCKER_HUB/$IMAGE_NAME:latest"
                }
            }
        }

        stage('Kubernetes Deploy') {
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }
}
